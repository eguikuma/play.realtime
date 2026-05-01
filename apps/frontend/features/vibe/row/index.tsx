"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Avatar } from "../avatar";
import { Heading } from "./heading";
import { useRow } from "./use-row";

/**
 * 空気の並びの最上位部品
 * 小見出しと顔表示の横並びを配置し メンバーがいない間は静かな文言だけを表示する
 */
export const VibeRow = ({ roomId }: { roomId: RoomId }) => {
  const row = useRow(roomId);

  return (
    <section className="mt-10 flex flex-col gap-4">
      <Heading />

      {row.empty ? (
        <p className="py-3 font-display text-ink-mute">まだ誰もいません</p>
      ) : (
        <div className="-mx-2 flex gap-1 overflow-x-auto px-2 pt-4 pb-3 [scroll-snap-type:x_mandatory] sm:flex-wrap sm:overflow-visible">
          {row.avatars.map((avatar) => (
            <div key={avatar.key} className="[scroll-snap-align:start]">
              <Avatar
                name={avatar.name}
                state={avatar.state}
                disabled={avatar.disabled}
                onInvite={avatar.onInvite}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
