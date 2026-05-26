import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  credits: integer("credits").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const storeConnections = pgTable("store_connections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  market: text("market").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  storeName: text("store_name"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const listingHistory = pgTable("listing_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  markets: text("markets").notNull(),
  platforms: text("platforms").notNull(),
  results: text("results").notNull(),
  translationMode: text("translation_mode"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const priceSnapshots = pgTable("price_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  timestamp: text("timestamp").notNull(),
  prices: text("prices").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
