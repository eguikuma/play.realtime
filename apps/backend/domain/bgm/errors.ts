import type { MemberId } from "@play.realtime/contracts";

/**
 * 未登録の楽曲を設定しようとしたときに投げる例外
 * `TrackIds` の列挙範囲外をドメインの境界で弾くために使う
 */
export class UnknownTrack extends Error {
  /** 試みた楽曲識別子を持つ */
  readonly trackId: string;

  /**
   * 拒絶対象の楽曲識別子を添えて例外を組み立てる
   */
  constructor(trackId: string) {
    super(`Unknown BGM track ${trackId}`);
    this.name = "UnknownTrack";
    this.trackId = trackId;
  }
}

/**
 * undo 窓が開いていないのに undo を試みたときに投げる例外
 * ルーム作成直後や 10 秒窓の失効直後 あるいは直前の undo 直後に発生する
 */
export class UndoUnavailable extends Error {
  /**
   * 固定メッセージで例外を組み立てる
   */
  constructor() {
    super("No undoable BGM change is available");
    this.name = "UndoUnavailable";
  }
}

/**
 * undo 窓が閉じた後に undo を試みたときに投げる例外
 * ドメインは現在時刻を入力として受け取るため 競合を起こさずに判定できる
 */
export class UndoExpired extends Error {
  /**
   * 固定メッセージで例外を組み立てる
   */
  constructor() {
    super("The BGM undo window has expired");
    this.name = "UndoExpired";
  }
}

/**
 * 直前の変更を当人自身が undo しようとしたときに投げる例外
 * 本人が undo できると「気分で何度も戻す」を許してしまうため 他のメンバー専用として弾く
 */
export class UndoBySelf extends Error {
  /** undo を試みたメンバーの ID を持つ */
  readonly memberId: MemberId;

  /**
   * 拒絶対象のメンバー ID を添えて例外を組み立てる
   */
  constructor(memberId: MemberId) {
    super(`Member ${memberId} cannot undo their own BGM change`);
    this.name = "UndoBySelf";
    this.memberId = memberId;
  }
}
