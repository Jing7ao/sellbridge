import crypto from "node:crypto";

const ADMIN_KEY = process.env.ADMIN_KEY || "sellbridge-admin-2026";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sellbridge2026";

const COOKIE_NAME = "sb-admin-token";

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", ADMIN_KEY);
  hmac.update(payload);
  return `${payload}.${hmac.digest("hex")}`;
}

function verify(token: string): boolean {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return false;
  const payload = token.slice(0, idx);
  const expected = sign(payload);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createAdminToken(): string {
  const payload = `admin:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`;
  return sign(payload);
}

export function verifyAdminToken(token: string): boolean {
  try {
    return verify(token);
  } catch {
    return false;
  }
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}
