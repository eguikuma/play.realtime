"use client";

import type { Member, Room } from "@play.realtime/contracts";
import { create } from "zustand";

/**
 * ルームのクライアント側ストアが持つ形
 * ルームは全参加者 自分自身はクライアントに紐づく 1 名で どちらも未解決時はなしとなる
 * メンバー追加は空気の受信時などに差分で積む経路で 重複する ID は冪等に弾く
 */
type RoomState = {
  room: Room | null;
  me: Member | null;
  setRoom: (room: Room) => void;
  setMe: (me: Member) => void;
  addMember: (member: Member) => void;
};

/**
 * ルームのクライアント側ストア
 * 読み込みフックが cookie セッションから復元した参加情報を ここに載せる
 */
export const useRoom = create<RoomState>()((set) => ({
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
