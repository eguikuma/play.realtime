import type { MemberId, Murmur, MurmurId, RoomId } from "@play.realtime/contracts";

/**
 * ひとこと投稿 1 件を組み立てる純粋関数
 * ID と時刻は呼び出し側 usecase で採番して渡すため、ここでは値の組み立てだけを担当する
 */
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
