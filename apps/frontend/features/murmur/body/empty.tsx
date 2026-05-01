"use client";

/**
 * 投稿が 0 件のときに表示する案内
 * まだ誰も書いていない場の雰囲気を崩さない 静かな文言だけを置く
 */
export const Empty = () => (
  <div className="scrollable flex min-h-0 flex-1 flex-col items-start gap-2 overflow-y-auto py-4 md:gap-3 md:py-6">
    <span aria-hidden className="h-px w-12 shrink-0 bg-rule" />
    <p className="max-w-[44ch] font-display text-base text-ink-mute leading-normal [word-break:auto-phrase] md:text-xl md:leading-relaxed">
      今日はまだ、誰も何も書いていません
      <br />
      最初のひとことは、思いついた順に
    </p>
  </div>
);
