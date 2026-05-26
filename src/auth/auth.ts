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
  if (!session?.user) return null;

  const userId = (session.user as { id: string }).id;
  const email = session.user.email ?? "";

  // 验证用户是否仍存在（防止数据库被重建后旧 session 残留）
  if (userId) {
    try {
      const exists = db.select({ _: users.id }).from(users).where(eq(users.id, userId)).get();
      if (!exists) return null;
    } catch {
      // DB 初始化失败也返回 null
      return null;
    }
  }

  return { userId, email };
}

export async function requireAuth(): Promise<{ userId: string; email: string }> {
  const auth = await getAuth();
  if (!auth) throw new Error("Unauthorized");
  return auth;
}
