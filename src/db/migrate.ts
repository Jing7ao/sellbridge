import { sql } from "drizzle-orm";
import { db } from "./index";
import { users, planPeriods } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

/** 应用启动时执行，自动添加缺失的列和表，并执行一次性数据修复 */
export async function runMigrations() {
  try {
    // users.plan
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN plan text DEFAULT 'basic';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // users.plan_expires_at
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN plan_expires_at timestamp;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // plan_periods 表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS plan_periods (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_plan_periods_user
      ON plan_periods(user_id, starts_at);
    `);

    // 一次性：将现有 users.plan 数据迁移到 plan_periods（仅执行一次）
    const existing = await db.execute(sql`SELECT 1 FROM plan_periods LIMIT 1`);
    if (existing.rows.length === 0) {
      const paidUsers = await db.execute(sql`
        SELECT id, plan, plan_expires_at FROM users
        WHERE plan IN ('pro', 'enterprise') AND plan_expires_at > NOW()
      `);

      for (const row of paidUsers.rows) {
        const id = crypto.randomUUID();
        await db.execute(sql`
          INSERT INTO plan_periods (id, user_id, plan, starts_at, ends_at)
          VALUES (${id}, ${row.id as string}, ${row.plan as string}, NOW(), ${row.plan_expires_at as string})
        `);
      }

      if (paidUsers.rows.length > 0) {
        console.log(`[migrate] Migrated ${paidUsers.rows.length} active plan(s) to plan_periods`);
      }

      // 1063929257@qq.com 初始企业版 30 天（如用户已存在则补一条记录）
      const adminUser = await db
        .select({ id: users.id, plan: users.plan })
        .from(users)
        .where(eq(users.email, "1363929257@qq.com"))
        .limit(1);

      if (adminUser[0]) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        const periodId = crypto.randomUUID();
        await db.execute(sql`
          INSERT INTO plan_periods (id, user_id, plan, starts_at, ends_at)
          VALUES (${periodId}, ${adminUser[0].id}, 'enterprise', NOW(), ${expires.toISOString()})
        `);
        console.log("[migrate] Granted enterprise 30d to 1363929257@qq.com");
      }
    }

    console.log("[migrate] Schema check complete");
  } catch (err) {
    console.error("[migrate] Migration error:", err);
  }
}
