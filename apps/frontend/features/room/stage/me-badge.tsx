"use client";

import { Monogram } from "@/components/monogram";

type MeBadge = {
  /** 自分の表示名、頭文字バッジと右側のラベルの両方に使う */
  name: string;
};

/**
 * ルームヘッダーの右端に置く「あなたはここにいます」表示
 * `Monogram` を頭文字バッジに据え、その横に名前ラベルを並べた pill 形状で、自分が今この部屋にいることを視覚化する
 */
export const MeBadge = ({ name }: MeBadge) => (
  <span className="flex items-center gap-2 rounded-pill border border-rule bg-paper-2/70 px-3 py-1.5 backdrop-blur-sm">
    <Monogram
      name={name}
      className="size-6 bg-paper text-[11px] text-lamp"
      style={{
        boxShadow: "inset 0 0 0 1.5px var(--lamp), 0 0 0 3px oklch(from var(--lamp) l c h / 0.18)",
      }}
    />
    <span className="max-w-[9ch] truncate font-sans text-ink text-sm">{name}</span>
  </span>
);
