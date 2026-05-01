"use client";

import type { Member, Room } from "@play.realtime/contracts";
import { create } from "zustand";

type RoomState = {
  room: Room | null;
  me: Member | null;
  setRoom: (room: Room) => void;
  setMe: (me: Member) => void;
  addMember: (member: Member) => void;
};

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
