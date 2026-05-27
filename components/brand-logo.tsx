/**
 * SellBridge 品牌图标 — 原创 SVG
 * 概念：渐变圆角方形 + 白色 S 字母
 */
export function BrandIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SellBridge"
    >
      {/* 圆角方形背景 */}
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#sb-bg)" />
      {/* S 字母 */}
      <path
        d="M20 20 C20 16 44 16 44 20 C44 26 20 24 20 30 C20 36 44 38 44 44 C44 48 20 48 20 44"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id="sb-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BrandWordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="gradient-text font-bold tracking-tight"
      style={{ fontSize: size }}
    >
      SellBridge
    </span>
  );
}
