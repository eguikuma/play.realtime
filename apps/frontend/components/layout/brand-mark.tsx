"use client";

type BrandMark = {
  /** Tailwind の size-* など、表示サイズを呼び出し側から指定する */
  className?: string;
};

/**
 * りもどきのランプアイコン
 * `app/icon.svg` (favicon / app-icon 用) と意匠を共有しつつ、UI 上では paper の角丸背景を省いて地続きで馴染ませる
 */
export const BrandMark = ({ className }: BrandMark) => (
  <svg
    role="img"
    aria-label="りもどき"
    viewBox="70 90 920 920"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <radialGradient id="brand-mark-glow" cx="510" cy="490" r="340" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBE6BD" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#E0974A" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#FAF5EC" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x="70" y="90" width="920" height="920" fill="url(#brand-mark-glow)" />
    <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="500" cy="880" rx="200" ry="28" />
      <rect x="486" y="660" width="28" height="220" rx="14" />
      <circle cx="500" cy="660" r="28" />
      <line x1="500" y1="660" x2="340" y2="440" strokeWidth="40" />
      <circle cx="340" cy="440" r="28" />
      <line x1="340" y1="440" x2="540" y2="340" strokeWidth="40" />
      <circle cx="540" cy="340" r="22" />
      <polygon points="520,330 562,318 700,470 568,494" />
    </g>
    <ellipse cx="634" cy="482" rx="60" ry="12" fill="#FBE6BD" />
    <polygon points="568,494 700,470 760,640 510,660" fill="#E0974A" opacity="0.32" />
  </svg>
);
