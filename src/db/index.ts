import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

let _db: ReturnType<typeof drizzle> | null = null;
let _initPromise: Promise<void> | null = null;

const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    credits INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS store_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    market TEXT NOT NULL,
    encrypted_credentials TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    store_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS listing_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    markets TEXT NOT NULL,
    platforms TEXT NOT NULL,
    results TEXT NOT NULL,
    translation_mode TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS price_snapshots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL,
    prices TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

function getDb() {
  if (_db) return _db;

  if (!DATABASE_URL) {
    throw new Error("[db] DATABASE_URL not set");
  }

  const isPublicHost = DATABASE_URL.includes("rlwy.net") || DATABASE_URL.includes("railway.app");

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    ...(isPublicHost ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  pool.on("error", (err) => {
    console.error("[db] Pool error:", err.message);
  });

  // 建表 + 预热连接，失败则重试一次
  _initPromise = pool.query(INIT_SQL).then(() => {
    console.log("[db] Tables initialized");
  }).catch(async (err) => {
    console.error("[db] Auto-create tables failed:", err.message);
    await new Promise((r) => setTimeout(r, 3000));
    try {
      await pool.query(INIT_SQL);
      console.log("[db] Tables initialized on retry");
    } catch (err2) {
      console.error("[db] Retry also failed:", (err2 as Error).message);
    }
  });

  _db = drizzle(pool, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const real = getDb();
    const value = (real as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(real);
    }
    return value;
  },
});

export type Database = ReturnType<typeof drizzle>;
