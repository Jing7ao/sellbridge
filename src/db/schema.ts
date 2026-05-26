import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  credits: integer("credits").notNull().default(100),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const creditTransactions = sqliteTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),  // "signup_bonus" | "topup" | "listing_fee" | "refund"
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const storeConnections = sqliteTable("store_connections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),   // "lazada" | "shopee" | "tiktok" | "shopify"
  market: text("market").notNull(),       // "th" | "vn" | "id" | "my" | "ph" | "sg"
  encryptedCredentials: text("encrypted_credentials").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  storeName: text("store_name"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const listingHistory = sqliteTable("listing_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  markets: text("markets").notNull(),       // JSON array
  platforms: text("platforms").notNull(),   // JSON array
  results: text("results").notNull(),       // JSON blob
  translationMode: text("translation_mode"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const priceSnapshots = sqliteTable("price_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  timestamp: text("timestamp").notNull(),
  prices: text("prices").notNull(),         // JSON: Record<string, number>
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
