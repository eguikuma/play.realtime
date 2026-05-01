import type { Member, MemberId, Room, RoomId } from "@play.realtime/contracts";

export const create = (parameters: { id: RoomId; host: Member; createdAt: string }): Room => ({
  id: parameters.id,
  hostMemberId: parameters.host.id,
  members: [parameters.host],
  createdAt: parameters.createdAt,
});

export const join = (room: Room, member: Member): Room => {
  if (room.members.some((existing) => existing.id === member.id)) {
    return room;
  }
  return { ...room, members: [...room.members, member] };
};

export const leave = (room: Room, memberId: MemberId): Room => ({
  ...room,
  members: room.members.filter((each) => each.id !== memberId),
});
