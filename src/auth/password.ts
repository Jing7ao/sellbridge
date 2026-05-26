export interface PasswordCheck {
  valid: boolean;
  errors: string[];
  strength: 0 | 1 | 2 | 3 | 4;
  label: string;
}

export function checkPassword(password: string): PasswordCheck {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push("密码至少 8 位");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("需包含至少一个大写字母");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("需包含至少一个小写字母");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("需包含至少一个数字");
  }

  // Strength: 0-4 based on how many criteria pass + length bonus
  let raw = 0;
  if (password.length >= 8) raw++;
  if (password.length >= 12) raw++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) raw++;
  if (/[0-9]/.test(password)) raw++;
  if (/[^A-Za-z0-9]/.test(password)) raw++;
  const strength = Math.min(4, raw) as 0 | 1 | 2 | 3 | 4;

  const labels: Record<number, string> = { 0: "太弱", 1: "弱", 2: "一般", 3: "强", 4: "很强" };

  return {
    valid: errors.length === 0,
    errors,
    strength,
    label: labels[strength],
  };
}
