"use client";

import type { CallId } from "@play.realtime/contracts";
import { useState } from "react";

import { Composer } from "./composer";
import { Head } from "./head";
import { Log } from "./log";
import { Pill } from "./pill";
import { useCall } from "./use-call";

type Call = {
  callId: CallId;
  peerName: string;
};

export const Call = ({ callId, peerName }: Call) => {
  const call = useCall({ callId });
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return <Pill peerName={peerName} onExpand={() => setMinimized(false)} onLeave={call.onLeave} />;
  }

  return (
    <div className="pointer-events-auto mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl border border-rule bg-paper/95 shadow-[0_32px_64px_-24px_oklch(from_var(--ink)_l_c_h/0.35)] backdrop-blur-xl">
      <Head peerName={peerName} onLeave={call.onLeave} onMinimize={() => setMinimized(true)} />
      <Log ref={call.ref} empty={call.empty} entries={call.entries} />
      <Composer {...call.composer} />
    </div>
  );
};
