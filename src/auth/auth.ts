import { getServerSession } from "next-auth";
import { authConfig } from "./auth.config";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export function getSession() {
  return getServerSession(authConfig);
}

export async function getAuth(): Promise<{ userId: string; email: string } | null> {
  const session = await getSession();
  if (!session?.user) {
    console.warn("[auth] getAuth: no session or no user");
    return null;
  }

  const userId = (session.user as { id: string }).id;
  const email = session.user.email ?? "";

  if (!userId) {
    console.warn("[auth] getAuth: session has no userId");
    return null;
  }

  // 验证用户是否仍存在（防止数据库被重建后旧 session 残留）
  try {
    const rows = await db.select({ _: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!rows[0]) {
      console.warn("[auth] getAuth: user not found in DB", { userId });
      return null;
    }
  } catch (err) {
    console.error("[auth] getAuth: DB error checking user existence:", (err as Error).message);
    return null;
  }

  return { userId, email };
}

export async function requireAuth(): Promise<{ userId: string; email: string }> {
  const auth = await getAuth();
  if (!auth) throw new Error("Unauthorized");
  return auth;
}
