import type { CSSProperties } from "react";
import { cn } from "@/libraries/classname";

type Monogram = {
  /** 頭文字を取り出す元の名前、本体には常に `name.slice(0, 1)` だけを描画する */
  name: string;
  /** サイズ・配色・font サイズなどの装飾、呼び出し側のレイアウトに合わせて足す */
  className?: string;
  /** ring や glow の `boxShadow` を当てるための style、装飾の濃淡は呼び出し側で決める */
  style?: CSSProperties;
};

/**
 * 名前の頭文字を円形の中に配置するアバター用バッジ
 * 通話相手・ひとこと投稿者・自分のヘッダーなど、似た形の頭文字バッジを 1 つに寄せる
 * 装飾系 (サイズ・配色・ring) は className と style で外から被せ、本体は形と中身の固定だけを担う
 * 装飾扱いの要素なので `aria-hidden` を必ず付け、スクリーンリーダーには名前を別途読み上げさせる
 */
export const Monogram = ({ name, className, style }: Monogram) => (
  <span
    aria-hidden
    className={cn(
      "flex shrink-0 items-center justify-center rounded-full font-bold font-display",
      className,
    )}
    style={style}
  >
    {name.slice(0, 1)}
  </span>
);
