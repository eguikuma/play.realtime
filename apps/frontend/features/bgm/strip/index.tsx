"use client";

import type { RoomId } from "@play.realtime/contracts";

import { cn } from "@/libraries/classname";

import { Panel } from "../panel";
import { Controls } from "./controls";
import { Lead } from "./lead";
import { NowPlaying } from "./now-playing";
import { Trigger } from "./trigger";
import { UndoBanner } from "./undo-banner";
import { useStrip } from "./use-strip";

type BgmStrip = {
  /** 接続先のルーム ID、SSE 購読と選曲 API の宛先に使う */
  roomId: RoomId;
};

/**
 * ルーム画面下部に常駐する BGM ストリップ
 * 再生状態のアイコン、いま鳴っている曲、再生と一時停止のトグル、音量、選曲パネルの開閉トリガーを 1 本のバーに並べる
 * 同時に `<audio>` 要素も非表示で同じコンポーネント内に持ち、再生制御の副作用を可視 UI と同じ場所で扱う
 * 選曲パネルは開いたときだけ absolute で浮かせて表示し、undo バナーも同じ基点から重ねる
 */
export const BgmStrip = ({ roomId }: BgmStrip) => {
  const strip = useStrip(roomId);

  return (
    <div ref={strip.ref} className="relative">
      <div
        className={cn(
          "relative flex items-center gap-3 overflow-hidden rounded-md border border-rule py-2.5 short:py-1.5 pr-3 pl-4 transition-colors",
          strip.shell.active ? "bg-paper-2" : "bg-paper/60",
        )}
      >
        <Lead {...strip.lead} />
        <NowPlaying {...strip.nowPlaying} />
        <Controls {...strip.controls} />
        <Trigger open={strip.open} onToggle={strip.toggle} />
      </div>

      {strip.undoBanner && <UndoBanner {...strip.undoBanner} />}

      {strip.open && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-30">
          <Panel roomId={strip.roomId} onClose={strip.close} />
        </div>
      )}

      {/* biome-ignore lint/a11y/useMediaCaption: ambient BGM のため caption 対象の発話情報が無い */}
      <audio
        ref={strip.audio.ref}
        src={strip.audio.src ?? undefined}
        loop
        preload="auto"
        onPlaying={strip.audio.onPlaying}
        onCanPlay={strip.audio.onCanPlay}
        onWaiting={strip.audio.onWaiting}
        onError={strip.audio.onError}
        className="hidden"
        aria-hidden
      />
    </div>
  );
};
