import { getServerSession } from "next-auth";
import { authConfig } from "./auth.config";

export function getSession() {
  return getServerSession(authConfig);
}

export async function getAuth(): Promise<{ userId: string; email: string } | null> {
  const session = await getSession();
  if (!session?.user) return null;
  return {
    userId: (session.user as { id: string }).id,
    email: session.user.email ?? "",
  };
}

export async function requireAuth(): Promise<{ userId: string; email: string }> {
  const auth = await getAuth();
  if (!auth) throw new Error("Unauthorized");
  return auth;
}
