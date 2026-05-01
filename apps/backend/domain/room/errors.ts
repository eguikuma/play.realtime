import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * 対象の `RoomId` に該当するルームが見つからなかったときに投げる Domain Error
 * URL で共有されたルームが既に閉じられた、または存在しない場合に発生し、HTTP では 404 に変換される
 */
export class RoomNotFound extends Error {
  readonly id: RoomId;

  constructor(id: RoomId) {
    super(`Room not found: ${id}`);
    this.name = "RoomNotFound";
    this.id = id;
  }
}

/**
 * 指定ルーム内に該当メンバーが存在しなかったときに投げる Domain Error
 * セッション Cookie に残っている `MemberId` が、ルーム側では既に退室扱いになっている場合などに発生する
 */
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
