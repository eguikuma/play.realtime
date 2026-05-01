"use client";

import type { RoomId } from "@play.realtime/contracts";
import { use } from "react";

import { BgmStrip } from "@/features/bgm";
import { HallwayOverlays } from "@/features/hallway";
import { MurmurBody } from "@/features/murmur";
import { JoinPage, useLoad, useRoom } from "@/features/room";
import { useVibe, VibeRow } from "@/features/vibe";

/**
 * ルーム入室後のメインステージ
 * BGM 空気 ひとこと 廊下トークの 4 機能を縦並びに束ね ヘッダーに人数と自分の表示を載せる
 */
const RoomStage = ({ roomId }: { roomId: RoomId }) => {
  const me = useRoom((state) => state.me);
  const presentCount = useVibe((state) => Object.keys(state.statuses).length);

  return (
    <div className="relative h-svh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70svh] animate-lamp-drift bg-[radial-gradient(ellipse_55%_75%_at_14%_4%,oklch(from_var(--lamp)_l_c_h/0.32),transparent_62%)]"
      />
      <div className="relative mx-auto flex h-full max-w-[980px] flex-col px-6 pt-8 md:px-10 md:pt-12">
        <header className="flex shrink-0 items-center justify-between gap-6">
          <span className="font-bold font-display text-[30px] text-ink leading-none tracking-[-0.01em]">
            りもどき
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden font-sans text-[12px] text-ink-mute sm:inline">
              {presentCount}人が部屋にいます
            </span>
            {me && (
              <span className="flex items-center gap-2 rounded-pill border border-rule bg-paper-2/70 px-3 py-1.5 backdrop-blur-sm">
                <span
                  className="flex size-6 items-center justify-center rounded-full bg-paper font-bold font-display text-[11px] text-lamp"
                  style={{
                    boxShadow:
                      "inset 0 0 0 1.5px var(--lamp), 0 0 0 3px oklch(from var(--lamp) l c h / 0.18)",
                  }}
                  aria-hidden
                >
                  {me.name.slice(0, 1)}
                </span>
                <span className="max-w-[9ch] truncate font-sans text-ink text-sm">{me.name}</span>
              </span>
            )}
          </div>
        </header>

        <div className="shrink-0">
          <BgmStrip roomId={roomId} />
        </div>

        <div className="shrink-0">
          <VibeRow roomId={roomId} />
        </div>

        <main className="mt-14 flex min-h-0 flex-1 flex-col pb-6">
          <MurmurBody roomId={roomId} />
        </main>
      </div>

      <HallwayOverlays roomId={roomId} />
    </div>
  );
};

/**
 * ルームページのエントリー
 * 読み込み中はローディング演出 未参加なら参加ページ 参加済みならステージを出し分ける
 */
export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const branded = roomId as RoomId;
  const { loading } = useLoad(branded);
  const me = useRoom((state) => state.me);

  if (loading) {
    return (
      <div
        aria-label="読み込み中"
        aria-busy="true"
        role="status"
        className="flex min-h-svh items-center justify-center"
      >
        <span aria-hidden className="relative flex size-10 items-center justify-center">
          <span
            className="absolute inset-0 animate-breath rounded-full"
            style={{
              boxShadow: "0 0 0 2px var(--lamp), 0 0 32px 4px oklch(from var(--lamp) l c h / 0.5)",
            }}
          />
          <span className="size-2.5 rounded-full bg-lamp" />
        </span>
      </div>
    );
  }

  if (!me) {
    return <JoinPage roomId={branded} />;
  }

  return <RoomStage roomId={branded} />;
}
