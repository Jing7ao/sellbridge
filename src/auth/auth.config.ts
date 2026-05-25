import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  (() => {
    console.warn("[auth] NEXTAUTH_SECRET not set, using random fallback — sessions will not survive restarts");
    return crypto.randomBytes(32).toString("hex");
  })();

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .get();

          if (!user) {
            console.log("[auth] no user found for email:", credentials.email);
            return null;
          }

          const valid = bcrypt.compareSync(credentials.password, user.passwordHash);
          if (!valid) {
            console.log("[auth] invalid password for email:", credentials.email);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: NEXTAUTH_SECRET,
};
