import type { CallId, InvitationId, MemberId } from "@play.realtime/contracts";

/**
 * 指定 `InvitationId` の招待が存在しなかったときに投げる Domain Error
 * 既に期限切れで削除済み、あるいは未知の ID が渡された場合に発生する
 */
export class InvitationNotFound extends Error {
  readonly id: InvitationId;

  constructor(id: InvitationId) {
    super(`Invitation not found ${id}`);
    this.name = "InvitationNotFound";
    this.id = id;
  }
}

/**
 * 指定 `CallId` の通話が存在しなかったときに投げる Domain Error
 * 既に終了している通話に対して `Send` や `Leave` が届いた場合に発生する
 */
export class CallNotFound extends Error {
  readonly id: CallId;

  constructor(id: CallId) {
    super(`Call not found ${id}`);
    this.name = "CallNotFound";
    this.id = id;
  }
}

/**
 * 招待された相手が在室していない、または既に通話中で招待を受けられないときに投げる Domain Error
 */
export class InviteeUnavailable extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Invitee unavailable ${memberId}`);
    this.name = "InviteeUnavailable";
    this.memberId = memberId;
  }
}

/**
 * 招待発行者自身が既に通話中で、さらに新しい招待を発行できないときに投げる Domain Error
 */
export class InviterBusy extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Inviter busy ${memberId}`);
    this.name = "InviterBusy";
    this.memberId = memberId;
  }
}

/**
 * 自分自身を招待しようとしたときに投げる Domain Error
 * クライアント側でも UI で禁止するが、サーバ側でも二重に弾いて不正な命令を通さない
 */
export class SelfInviteNotAllowed extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Self invite not allowed ${memberId}`);
    this.name = "SelfInviteNotAllowed";
    this.memberId = memberId;
  }
}

/**
 * 通話の参加者ではないメンバーが `Send` や `Leave` を送ったときに投げる Domain Error
 * `NotCallParticipant` は通話の ID を推測して他人の通話に割り込む経路を塞ぐ
 */
export class NotCallParticipant extends Error {
  readonly callId: CallId;

  readonly memberId: MemberId;

  constructor(callId: CallId, memberId: MemberId) {
    super(`Not a call participant ${memberId} in ${callId}`);
    this.name = "NotCallParticipant";
    this.callId = callId;
    this.memberId = memberId;
  }
}
