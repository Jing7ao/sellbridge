import { sql } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

/** 应用启动时执行，自动添加缺失的列，并执行一次性数据修复 */
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

    // 一次性：升级 1363929257@qq.com 为 30 天企业版（仅基础版用户）
    const adminUser = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.email, "1363929257@qq.com"))
      .limit(1);

    if (adminUser[0] && (!adminUser[0].plan || adminUser[0].plan === "basic")) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      await db
        .update(users)
        .set({ plan: "enterprise", planExpiresAt: expires })
        .where(eq(users.email, "1363929257@qq.com"));
      console.log("[migrate] Upgraded 1363929257@qq.com to enterprise (30 days)");
    }

    console.log("[migrate] Schema check complete");
  } catch (err) {
    console.error("[migrate] Migration error:", err);
  }
}
