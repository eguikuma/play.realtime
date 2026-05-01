"use client";

/**
 * Vibe 行の見出し
 * 見出し文と案内テキストを左に寄せ、右側に細い罫線を引いて区切りを示す
 */
export const Heading = () => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <span className="font-bold font-display text-[15px] text-ink">いま、この部屋に</span>
      <span className="font-sans text-[12px] text-ink-mute">話しかけるボタンで誘えます</span>
    </div>
    <span aria-hidden className="hidden h-px flex-1 bg-rule/70 sm:block" />
  </div>
);
