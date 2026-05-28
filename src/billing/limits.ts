import { db } from "../db/index";
import { users, creditTransactions, storeConnections, planPeriods } from "../db/schema";
import { eq, and, lte, gt, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";

export type PlanTier = "basic" | "pro" | "enterprise";

const PLAN_TIERS: Record<PlanTier, number> = { basic: 0, pro: 1, enterprise: 2 };

export const PLAN_CREDITS: Record<PlanTier, number> = {
  basic: 20,
  pro: 500,
  enterprise: 2000,
};

const SHOP_LIMITS: Record<PlanTier, number> = {
  basic: 1,
  pro: 5,
  enterprise: Infinity,
};

const FEATURE_GATES: Record<string, PlanTier> = {
  monitor: "pro",
  orders: "pro",
  inventory: "pro",
  adjust: "enterprise",
};

export function getShopLimit(plan: PlanTier): number {
  return SHOP_LIMITS[plan];
}

export function isFeatureAllowed(plan: PlanTier, feature: string): boolean {
  const required = FEATURE_GATES[feature];
  if (!required) return true;
  return PLAN_TIERS[plan] >= PLAN_TIERS[required];
}

/** 从 plan_periods 查询当前活跃方案，查不到时回退 users 表 */
export async function getUserPlan(userId: string): Promise<PlanTier> {
  // 优先查 plan_periods
  try {
    const now = new Date();
    const rows = await db
      .select({ plan: planPeriods.plan })
      .from(planPeriods)
      .where(
        and(
          eq(planPeriods.userId, userId),
          lte(planPeriods.startsAt, now),
          gt(planPeriods.endsAt, now),
        )
      )
      .orderBy(planPeriods.startsAt)
      .limit(1);

    const plan = rows[0]?.plan;
    if (plan === "pro" || plan === "enterprise") return plan;
  } catch {
    console.error("[getUserPlan] plan_periods query failed, falling back to users table");
  }

  // 回退：查 users 表旧字段
  try {
    const userRows = await db
      .select({ plan: users.plan, planExpiresAt: users.planExpiresAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const u = userRows[0];
    if (u?.plan === "pro" || u?.plan === "enterprise") {
      if (u.planExpiresAt && new Date(u.planExpiresAt) > new Date()) {
        return u.plan;
      }
    }
  } catch {
    console.error("[getUserPlan] users table fallback also failed");
  }

  return "basic";
}

/** 返回最远的到期时间（用于前端显示） */
export async function getPlanExpiry(userId: string): Promise<Date | null> {
  try {
    const rows = await db
      .select({ endsAt: planPeriods.endsAt })
      .from(planPeriods)
      .where(eq(planPeriods.userId, userId))
      .orderBy(desc(planPeriods.endsAt))
      .limit(1);
    return rows[0]?.endsAt ?? null;
  } catch {
    return null;
  }
}

/** 检查用户是否从未购买过付费方案（首充买一赠一判定） */
export async function isFirstPlanPurchase(userId: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: planPeriods.id })
      .from(planPeriods)
      .where(eq(planPeriods.userId, userId))
      .limit(1);
    return rows.length === 0;
  } catch {
    return true; // 查询失败时保守视为首充
  }
}

/**
 * 授予方案周期，处理叠加/顺延逻辑
 *
 * - 无活跃周期 → 从今天开始新建
 * - 同方案续费 → 延长当前周期，后移后续周期
 * - 低→高升级 → 截断当前，插入高级，剩余低级时间顺延
 * - 高→低购买 → 排队到当前周期结束后
 */
export async function grantPlanPeriod(
  userId: string,
  newPlan: PlanTier,
  durationDays: number,
): Promise<void> {
  const now = new Date();
  const extensionMs = durationDays * 24 * 60 * 60 * 1000;

  // 查找当前活跃周期
  const activeRows = await db
    .select()
    .from(planPeriods)
    .where(
      and(
        eq(planPeriods.userId, userId),
        lte(planPeriods.startsAt, now),
        gt(planPeriods.endsAt, now),
      )
    )
    .orderBy(planPeriods.startsAt)
    .limit(1);

  const active = activeRows[0];

  if (!active) {
    // 场景 1：无活跃周期 → 找最晚的周期末尾接上，避免重叠
    const lastRows = await db
      .select({ endsAt: planPeriods.endsAt })
      .from(planPeriods)
      .where(eq(planPeriods.userId, userId))
      .orderBy(desc(planPeriods.endsAt))
      .limit(1);

    const startAt = lastRows[0]?.endsAt && lastRows[0].endsAt > now ? lastRows[0].endsAt : now;
    const endAt = new Date(startAt.getTime() + extensionMs);

    await db.insert(planPeriods).values({
      id: crypto.randomUUID(),
      userId,
      plan: newPlan,
      startsAt: startAt,
      endsAt: endAt,
    });

    // 新方案立即生效 → 同步 users 表确保兼容（额度由调用方管理）
    await db.update(users).set({
      plan: newPlan,
      planExpiresAt: endAt,
    }).where(eq(users.id, userId));
    return;
  }

  const activePlan = active.plan as PlanTier;

  if (newPlan === activePlan) {
    // 场景 2：同方案续费 → 延长当前周期，额度重置为月配额
    const newActiveEnd = new Date(active.endsAt.getTime() + extensionMs);
    await db
      .update(planPeriods)
      .set({ endsAt: newActiveEnd })
      .where(eq(planPeriods.id, active.id));

    // 更新 users 表到期时间（额度由调用方管理）
    await db.update(users).set({
      planExpiresAt: newActiveEnd,
    }).where(eq(users.id, userId));

    // 后移所有后续周期（用 JS 逐条处理，避免 raw SQL 兼容问题）
    const futureRows = await db
      .select()
      .from(planPeriods)
      .where(
        and(
          eq(planPeriods.userId, userId),
          gt(planPeriods.startsAt, active.startsAt),
        )
      );

    for (const row of futureRows) {
      await db
        .update(planPeriods)
        .set({
          startsAt: new Date(row.startsAt.getTime() + extensionMs),
          endsAt: new Date(row.endsAt.getTime() + extensionMs),
        })
        .where(eq(planPeriods.id, row.id));
    }
    return;
  }

  if (PLAN_TIERS[newPlan] > PLAN_TIERS[activePlan]) {
    // 场景 3：低→高升级
    const remainingMs = active.endsAt.getTime() - now.getTime();

    // 截断当前到 now
    await db
      .update(planPeriods)
      .set({ endsAt: now })
      .where(eq(planPeriods.id, active.id));

    // 插入高级周期
    const highEnd = new Date(now.getTime() + extensionMs);
    await db.insert(planPeriods).values({
      id: crypto.randomUUID(),
      userId,
      plan: newPlan,
      startsAt: now,
      endsAt: highEnd,
    });

    // 升级 → 同步 users 表（额度由调用方管理）
    await db.update(users).set({
      plan: newPlan,
      planExpiresAt: highEnd,
    }).where(eq(users.id, userId));

    // 剩余低级时间顺延
    if (remainingMs > 0) {
      const residualStart = new Date(highEnd.getTime());
      await db.insert(planPeriods).values({
        id: crypto.randomUUID(),
        userId,
        plan: activePlan,
        startsAt: residualStart,
        endsAt: new Date(residualStart.getTime() + remainingMs),
      });
    }

    // 后移所有其他 future 周期（排除刚插入的两条）
    const futureRows = await db
      .select()
      .from(planPeriods)
      .where(
        and(
          eq(planPeriods.userId, userId),
          gt(planPeriods.startsAt, now),
        )
      );

    for (const row of futureRows) {
      // 跳过刚插入的高级周期和 residual（它们位置已正确）
      const isNewHigh = row.plan === newPlan && row.startsAt.getTime() === now.getTime();
      const isResidual = row.plan === activePlan && remainingMs > 0 && row.startsAt.getTime() === highEnd.getTime();
      if (isNewHigh || isResidual) continue;

      await db
        .update(planPeriods)
        .set({
          startsAt: new Date(row.startsAt.getTime() + extensionMs),
          endsAt: new Date(row.endsAt.getTime() + extensionMs),
        })
        .where(eq(planPeriods.id, row.id));
    }
    return;
  }

  // 场景 4：高→低购买 → 排队到最后
  const lastRows = await db
    .select({ endsAt: planPeriods.endsAt })
    .from(planPeriods)
    .where(eq(planPeriods.userId, userId))
    .orderBy(desc(planPeriods.endsAt))
    .limit(1);

  const anchor = lastRows[0]?.endsAt ?? now;
  const startAt = anchor > now ? anchor : now;
  const endAt = new Date(startAt.getTime() + extensionMs);

  // 已有同方案排队则延长
  const queued = await db
    .select()
    .from(planPeriods)
    .where(
      and(
        eq(planPeriods.userId, userId),
        eq(planPeriods.plan, newPlan),
        gt(planPeriods.startsAt, now),
      )
    )
    .orderBy(planPeriods.startsAt)
    .limit(1);

  if (queued[0]) {
    await db
      .update(planPeriods)
      .set({ endsAt: endAt })
      .where(eq(planPeriods.id, queued[0].id));
  } else {
    await db.insert(planPeriods).values({
      id: crypto.randomUUID(),
      userId,
      plan: newPlan,
      startsAt: startAt,
      endsAt: endAt,
    });
  }
}

/** 扣除积分。返回扣除后的余额，额度不足时返回 null */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
): Promise<number | null> {
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userRows[0];
  if (!user) return null;

  const current = user.credits ?? 0;
  if (current < amount) return null;

  const newBalance = current - amount;

  await db.update(users).set({ credits: newBalance }).where(eq(users.id, userId));

  await db.insert(creditTransactions).values({
    id: crypto.randomUUID(),
    userId,
    amount: -amount,
    type: "listing_fee",
    description,
  });

  return newBalance;
}

/** 获取用户已连接的活跃店铺数 */
export async function getActiveShopCount(userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(storeConnections)
    .where(eq(storeConnections.userId, userId));
  return rows[0]?.count ?? 0;
}
