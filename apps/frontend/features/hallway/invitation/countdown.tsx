"use client";

import { INVITATION_TTL_MS } from "./ttl";

type Countdown = {
  /** カード表示からすでに経過したミリ秒、Invitation 側で `INVITATION_TTL_MS - 残り時間` として算出する */
  elapsed: number;
};

/**
 * 招待カード下部に置く残り時間のプログレスバー
 * Invitation と同じく `animationDelay: -elapsed` で CSS animation を途中位置から走らせ、途中マウント時もバーの進行が揃うようにする
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
