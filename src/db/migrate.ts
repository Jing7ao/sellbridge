import { sql } from "drizzle-orm";
import { db } from "./index";

/** 应用启动时执行，自动添加缺失的列 */
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

    console.log("[migrate] Schema check complete");
  } catch (err) {
    console.error("[migrate] Migration error:", err);
  }
}
