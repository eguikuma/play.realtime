import type { MemberId, RoomId } from "@play.realtime/contracts";

export class RoomNotFound extends Error {
  readonly id: RoomId;

  constructor(id: RoomId) {
    super(`Room not found: ${id}`);
    this.name = "RoomNotFound";
    this.id = id;
  }
}

export class MemberNotFound extends Error {
  readonly roomId: RoomId;

  readonly memberId: MemberId;

  constructor(roomId: RoomId, memberId: MemberId) {
    super(`Member not found: ${memberId} in ${roomId}`);
    this.name = "MemberNotFound";
    this.roomId = roomId;
    this.memberId = memberId;
  }
}
