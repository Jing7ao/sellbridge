/**
 * SellBridge 品牌图标 — 原创 SVG，无版权风险
 * 概念：桥梁连接全球市场
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
      {/* 桥墩左 */}
      <rect x="4" y="24" width="8" height="36" rx="3" fill="url(#bg)" />
      {/* 桥墩右 */}
      <rect x="52" y="24" width="8" height="36" rx="3" fill="url(#bg)" />
      {/* 桥面弧线 */}
      <path
        d="M8 28 Q32 4 56 28"
        stroke="url(#bg)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* 全球节点 */}
      <circle cx="20" cy="44" r="5" fill="url(#bg)" opacity="0.6" />
      <circle cx="44" cy="44" r="5" fill="url(#bg)" opacity="0.6" />
      <circle cx="44" cy="52" r="3" fill="url(#bg)" opacity="0.35" />
      <circle cx="20" cy="52" r="3" fill="url(#bg)" opacity="0.35" />
      {/* 渐变定义 */}
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
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
