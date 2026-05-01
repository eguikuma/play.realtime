import type { CallId, InvitationId, MemberId } from "@play.realtime/contracts";

/**
 * 指定 ID の招待がすでに存在しないときに投げる例外
 * 失効直後や他者が承諾した直後など 競合状況で発生する
 */
export class InvitationNotFound extends Error {
  /** 対象となった招待の ID を持つ */
  readonly id: InvitationId;

  /**
   * 参照できなかった招待 ID を添えて例外を組み立てる
   */
  constructor(id: InvitationId) {
    super(`Invitation not found ${id}`);
    this.name = "InvitationNotFound";
    this.id = id;
  }
}

/**
 * 指定 ID の通話がすでに存在しないときに投げる例外
 * 参加者の片方が離脱や切断した直後の競合状況で発生する
 */
export class CallNotFound extends Error {
  /** 対象となった通話の ID を持つ */
  readonly id: CallId;

  /**
   * 参照できなかった通話 ID を添えて例外を組み立てる
   */
  constructor(id: CallId) {
    super(`Call not found ${id}`);
    this.name = "CallNotFound";
    this.id = id;
  }
}

/**
 * 招待相手が在室中でないか すでに別の会話に参加しているときに投げる例外
 * サーバー側でも招待発行時に再検証するため 必ずドメインで表現する
 */
export class InviteeUnavailable extends Error {
  /** 招待先として指定されたメンバーの ID を持つ */
  readonly memberId: MemberId;

  /**
   * 対象のメンバー ID を添えて例外を組み立てる
   */
  constructor(memberId: MemberId) {
    super(`Invitee unavailable ${memberId}`);
    this.name = "InviteeUnavailable";
    this.memberId = memberId;
  }
}

/**
 * 招待を出そうとした本人がすでに別の会話に参加しているときに投げる例外
 * 同時に複数会話を持てない規則を ドメインの不変条件として表現する
 */
export class InviterBusy extends Error {
  /** 取り込み中と判定された招待元メンバーの ID を持つ */
  readonly memberId: MemberId;

  /**
   * 対象のメンバー ID を添えて例外を組み立てる
   */
  constructor(memberId: MemberId) {
    super(`Inviter busy ${memberId}`);
    this.name = "InviterBusy";
    this.memberId = memberId;
  }
}

/**
 * 自分自身を招待しようとしたときに投げる例外
 * UI 側でも抑止するが 悪意あるクライアントへの備えとしてドメインで拒絶する
 */
export class SelfInviteNotAllowed extends Error {
  /** 自己招待を試みたメンバーの ID を持つ */
  readonly memberId: MemberId;

  /**
   * 対象のメンバー ID を添えて例外を組み立てる
   */
  constructor(memberId: MemberId) {
    super(`Self invite not allowed ${memberId}`);
    this.name = "SelfInviteNotAllowed";
    this.memberId = memberId;
  }
}

/**
 * 会話の参加者でないメンバーが 当該通話に対して操作をしたときに投げる例外
 * 送信や離脱などを他人の通話で行えないことを保証する
 */
export class NotCallParticipant extends Error {
  /** 操作対象となった通話の ID を持つ */
  readonly callId: CallId;
  /** 操作を試みたメンバーの ID を持つ */
  readonly memberId: MemberId;

  /**
   * 対象の通話 ID とメンバー ID の組を添えて例外を組み立てる
   */
  constructor(callId: CallId, memberId: MemberId) {
    super(`Not a call participant ${memberId} in ${callId}`);
    this.name = "NotCallParticipant";
    this.callId = callId;
    this.memberId = memberId;
  }
}
