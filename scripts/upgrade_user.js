// 直接升级用户方案
import pg from "pg";
const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: "postgresql://postgres:xrgMzQnLshyrtOPjvkLnwrHvdeZdxNWb@postgres-production-df5c.up.railway.app:5432/railway",
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  try {
    // 确保列存在
    await client.query(`DO $$ BEGIN ALTER TABLE users ADD COLUMN plan text DEFAULT 'basic'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`);
    await client.query(`DO $$ BEGIN ALTER TABLE users ADD COLUMN plan_expires_at timestamp; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`);

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const res = await client.query(
      `UPDATE users SET plan = 'enterprise', plan_expires_at = $1 WHERE email = '1363929257@qq.com' RETURNING id, email, plan, plan_expires_at`,
      [expires]
    );

    if (res.rows.length > 0) {
      console.log("Upgraded:", JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log("User not found. Creating a topup to ensure user exists...");
      // Check if user exists
      const userCheck = await client.query(`SELECT id, email FROM users WHERE email = '1363929257@qq.com'`);
      console.log("User query result:", JSON.stringify(userCheck.rows));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
