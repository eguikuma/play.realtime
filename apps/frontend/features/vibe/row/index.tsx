"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Avatar } from "../avatar";
import { Heading } from "./heading";
import { useRow } from "./use-row";

export const VibeRow = ({ roomId }: { roomId: RoomId }) => {
  const row = useRow(roomId);

  return (
    <section className="mt-6 flex flex-col gap-3 md:mt-10 md:gap-4">
      <Heading />

      {row.empty ? (
        <p className="py-3 font-display text-ink-mute">まだ誰もいません</p>
      ) : (
        <div className="-mx-2 flex gap-1 overflow-x-auto px-2 pt-3 pb-2 [scroll-snap-type:x_mandatory] sm:flex-wrap sm:overflow-visible md:pt-4 md:pb-3">
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
