"use client";

import type { RoomId } from "@play.realtime/contracts";
import { use } from "react";

import { BgmStrip } from "@/features/bgm";
import { HallwayOverlays } from "@/features/hallway";
import { Compose, MurmurBody } from "@/features/murmur";
import { Entrance, useLeave, useLoad, useRoom } from "@/features/room";
import { BrandMark } from "@/features/room/layout";
import { useVibe, VibeRow } from "@/features/vibe";

/**
 * 入室済みルームの画面本体
 * 外殻をビューポート高に固定し、内部を CSS Grid 5 行で組む
 * 行 1 から 4 (header / BGM / Vibe / Compose) を auto 高、行 5 (MurmurBody) のみ `minmax(0,1fr)` で可変にして、その内側だけがスクロールする
 * これにより flex-1 の連鎖で起きていた「静的子の合計がビューポートを超えると ol が 0 px に潰れる/外に溢れる」問題を構造的に避ける
 * Hallway の招待と通話オーバーレイは fixed 配置でレイアウトと独立しており、Grid 化の影響を受けない
 */
const RoomStage = ({ roomId }: { roomId: RoomId }) => {
  const me = useRoom((state) => state.me);
  const presentCount = useVibe((state) => Object.keys(state.statuses).length);
  useLeave(roomId);

  return (
    <div className="relative h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70svh] animate-lamp-drift bg-[radial-gradient(ellipse_55%_75%_at_14%_4%,oklch(from_var(--lamp)_l_c_h/0.32),transparent_62%)]"
      />
      <div className="relative mx-auto grid h-full max-w-[980px] grid-rows-[auto_auto_auto_auto_minmax(0,1fr)] gap-y-3 short:gap-y-2 px-4 pt-4 short:pt-2 pb-4 short:pb-2 md:gap-y-4 md:px-10 md:pt-6 md:pb-6">
        <header className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 font-bold font-display short:text-[20px] text-[24px] text-ink leading-none tracking-[-0.01em] md:text-[30px]">
            <BrandMark className="short:size-6 size-7 shrink-0 md:size-8" />
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

        <BgmStrip roomId={roomId} />

        <VibeRow roomId={roomId} />

        <Compose roomId={roomId} />

        <MurmurBody roomId={roomId} />
      </div>

      <HallwayOverlays roomId={roomId} />
    </div>
  );
};

/**
 * `/rooms/{roomId}` のエントリー
 * `useLoad` が読み込み中の間はローディングバッジだけを出し、未入室で成功したら入室フォームの `Entrance`、入室済みなら `RoomStage` を描画する
 * `useLoad` が 404 や 400 を検知すると内部で `notFound()` を呼ぶため、missing 時はこのコンポーネントは描画されずに `not-found.tsx` へ遷移する
 */
export default function RoomEntry({ params }: { params: Promise<{ roomId: string }> }) {
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
    return <Entrance roomId={branded} />;
  }

  return <RoomStage roomId={branded} />;
}
