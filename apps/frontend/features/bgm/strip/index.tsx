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

export const BgmStrip = ({ roomId }: { roomId: RoomId }) => {
  const strip = useStrip(roomId);

  return (
    <div ref={strip.ref} className="relative mt-3 md:mt-4">
      <div
        className={cn(
          "relative flex items-center gap-3 overflow-hidden rounded-md border border-rule py-2.5 pr-3 pl-4 transition-colors",
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
