"use client";

import { INVITATION_TTL_MS } from "./ttl";

/**
 * 残り時間帯の入力
 * 経過ミリ秒は招待発行からの累計で アニメーションの開始地点をずらすのに使う
 */
type Countdown = {
  elapsed: number;
};

/**
 * 招待カード下部の残り時間を表す 2 ピクセル幅の帯
 * CSS のアニメーションで減っていくため 部品側でタイマーを持たずに済む
 */
export const Countdown = ({ elapsed }: Countdown) => (
  <div aria-hidden className="relative h-[2px] w-full overflow-hidden rounded-pill bg-rule/60">
    <div
      className="absolute inset-y-0 left-0 bg-lamp"
      style={{
        animation: `invitation-countdown ${INVITATION_TTL_MS}ms linear forwards`,
        animationDelay: `-${elapsed}ms`,
      }}
    />
  </div>
);
