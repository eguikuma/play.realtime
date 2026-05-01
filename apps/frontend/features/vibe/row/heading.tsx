"use client";

export const Heading = () => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <span className="font-bold font-display text-[15px] text-ink">いま、この部屋に</span>
      <span className="font-sans text-[12px] text-ink-mute">タップで話しかけられます</span>
    </div>
    <span aria-hidden className="hidden h-px flex-1 bg-rule/70 sm:block" />
  </div>
);
