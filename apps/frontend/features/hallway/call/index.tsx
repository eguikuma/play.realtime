"use client";

import type { CallId } from "@play.realtime/contracts";

import { Composer } from "./composer";
import { Head } from "./head";
import { Log } from "./log";
import { useCall } from "./use-call";

/**
 * 通話ウィンドウの最上位部品の入力
 */
type Call = {
  callId: CallId;
  peerName: string;
};

/**
 * 画面下部に差し込む 1 対 1 の通話ウィンドウ
 * 上部 中央のログ 入力欄を縦に組み合わせ ビューモデルの組み立てはフックに委ねる
 */
export const Call = ({ callId, peerName }: Call) => {
  const call = useCall({ callId });

  return (
    <div className="pointer-events-auto mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl border border-rule bg-paper/95 shadow-[0_32px_64px_-24px_oklch(from_var(--ink)_l_c_h/0.35)] backdrop-blur-xl">
      <Head peerName={peerName} onLeave={call.onLeave} />
      <Log ref={call.ref} empty={call.empty} entries={call.entries} />
      <Composer {...call.composer} />
    </div>
  );
};
