import type { MemberId, Murmur, MurmurId, RoomId } from "@play.realtime/contracts";

export const post = (parameters: {
  id: MurmurId;
  roomId: RoomId;
  memberId: MemberId;
  text: string;
  postedAt: string;
}): Murmur => ({
  id: parameters.id,
  roomId: parameters.roomId,
  memberId: parameters.memberId,
  text: parameters.text,
  postedAt: parameters.postedAt,
});
