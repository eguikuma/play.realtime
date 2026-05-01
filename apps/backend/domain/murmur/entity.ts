import type { MemberId, Murmur, MurmurId, RoomId } from "@play.realtime/contracts";

/**
 * 新規のひとこと投稿を 1 件組み立てる
 * ID と投稿時刻はサーバーが生成した値を渡す前提とし ドメインは純粋な組み立てのみに留める
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
