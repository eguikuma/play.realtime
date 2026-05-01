"use client";

/**
 * ひとこと一覧が空のときに表示するプレースホルダ
 * 投稿を促す柔らかい案内文を置き、最初の投稿を書きやすい雰囲気を作る
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
