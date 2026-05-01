"use client";

import { INVITATION_TTL_MS } from "./ttl";

type Countdown = {
  elapsed: number;
};

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
