import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * 指定した ID のルームが見つからないときに投げる例外
 * URL の直接入力や すでに破棄されたルームへの操作で発生する
 */
export class RoomNotFound extends Error {
  /** 見つからなかったルームの ID を持つ */
  readonly id: RoomId;

  /**
   * 参照できなかったルーム ID を添えて例外を組み立てる
   */
  constructor(id: RoomId) {
    super(`Room not found: ${id}`);
    this.name = "RoomNotFound";
    this.id = id;
  }
}

/**
 * ルーム内に対象メンバーがいないときに投げる例外
 * cookie セッションと URL の組み合わせが壊れている場合や すでに退室したメンバーからの操作で発生する
 */
export class MemberNotFound extends Error {
  /** 探索対象のルーム ID を持つ */
  readonly roomId: RoomId;
  /** 見つからなかったメンバーの ID を持つ */
  readonly memberId: MemberId;

  /**
   * 対象となるルーム ID とメンバー ID の組を添えて例外を組み立てる
   */
  constructor(roomId: RoomId, memberId: MemberId) {
    super(`Member not found: ${memberId} in ${roomId}`);
    this.name = "MemberNotFound";
    this.roomId = roomId;
    this.memberId = memberId;
  }
}
