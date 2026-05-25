function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

if (!process.env.NEXTAUTH_SECRET) {
  console.warn(
    "[auth] NEXTAUTH_SECRET not set, generating random fallback — sessions will not survive restarts"
  );
  process.env.NEXTAUTH_SECRET = generateSecret();
}

export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;
