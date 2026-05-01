"use client";

import type { Member, Room } from "@play.realtime/contracts";
import { create } from "zustand";

type SessionState = {
  room: Room | null;
  me: Member | null;
  setRoom: (room: Room) => void;
  setMe: (me: Member) => void;
  addMember: (member: Member) => void;
};

/**
 * 入室中のルーム全景と自分自身のメンバー情報を束ねる zustand ストア
 * `setRoom` は GET と POST の応答による全置換
 * `setMe` は入室完了時に呼ぶ
 * `addMember` は Vibe SSE の `Joined` 受信で冪等追加する
 * `addMember` は同一 ID の重複追加を弾き、サーバ側の在室配列との整合を崩さない
 * 横断状態として `stores/` 配下に置き、atomic feature (bgm / hallway / murmur / vibe) はこの hook を直接参照する
 */
export const useSession = create<SessionState>()((set) => ({
  room: null,
  me: null,
  setRoom: (room) => set({ room }),
  setMe: (me) => set({ me }),
  addMember: (member) =>
    set((state) => {
      if (!state.room) return state;
      if (state.room.members.some((each) => each.id === member.id)) return state;
      return { room: { ...state.room, members: [...state.room.members, member] } };
    }),
}));
