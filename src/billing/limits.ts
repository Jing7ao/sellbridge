import { db } from "../db/index";
import { users, creditTransactions, storeConnections } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "node:crypto";

export type PlanTier = "basic" | "pro" | "enterprise";

const SHOP_LIMITS: Record<PlanTier, number> = {
  basic: 1,
  pro: 5,
  enterprise: Infinity,
};

const FEATURE_GATES: Record<string, PlanTier> = {
  monitor: "pro",
  orders: "pro",
  inventory: "pro",
};

/** 根据累计 topup 充值金额判断用户方案 */
export async function getUserPlan(userId: string): Promise<PlanTier> {
  const allTx = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId));

  let totalTopup = 0;
  for (const tx of allTx) {
    if (tx.type === "topup") {
      totalTopup += tx.amount;
    }
  }

  if (totalTopup >= 300) return "enterprise";
  if (totalTopup >= 100) return "pro";
  return "basic";
}

/** 获取方案允许的店铺连接数 */
export function getShopLimit(plan: PlanTier): number {
  return SHOP_LIMITS[plan];
}

/** 检查功能是否对用户方案开放 */
export function isFeatureAllowed(plan: PlanTier, feature: string): boolean {
  const required = FEATURE_GATES[feature];
  if (!required) return true;
  const tiers: PlanTier[] = ["basic", "pro", "enterprise"];
  return tiers.indexOf(plan) >= tiers.indexOf(required);
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
