"use client";

/**
 * 投稿が 0 件のときに表示する案内
 * まだ誰も書いていない場の雰囲気を崩さない 静かな文言だけを置く
 */
export const Empty = () => (
  <div className="flex flex-col items-start gap-3 py-10">
    <span aria-hidden className="h-px w-12 bg-rule" />
    <p className="max-w-[44ch] font-display text-ink-mute text-xl leading-relaxed [word-break:auto-phrase]">
      今日はまだ、誰も何も書いていません
      <br />
      最初のひとことは、思いついた順に
    </p>
  </div>
);
