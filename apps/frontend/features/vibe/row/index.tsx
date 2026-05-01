"use client";

import type { RoomId } from "@play.realtime/contracts";
import { Avatar } from "../avatar";
import { Heading } from "./heading";
import { useRow } from "./use-row";

type VibeRow = {
  /** 表示対象のルーム ID、SSE 購読と可視状態送信の宛先に使う */
  roomId: RoomId;
};

/**
 * ルーム画面の上部に置くメンバー在籍ビュー
 * Vibe 購読で集まった各メンバーの状態をアバター行として並べ、招待可能な相手には話しかけるボタンを表示する
 */
export const VibeRow = ({ roomId }: VibeRow) => {
  const row = useRow(roomId);

  return (
    <section className="flex flex-col gap-3 md:gap-4">
      <div className="short:hidden">
        <Heading />
      </div>

      {row.empty ? (
        <p className="py-3 font-display text-ink-mute">まだ誰もいません</p>
      ) : (
        <div className="-mx-2 grid auto-cols-[6rem] short:auto-cols-[3.5rem] grid-flow-col gap-1 overflow-x-auto px-2 pt-3 short:pt-1 pb-2 short:pb-0 [scroll-snap-type:x_mandatory] sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] sm:short:grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] sm:overflow-visible md:pt-4 md:pb-3">
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
