import type { MemberId } from "@play.realtime/contracts";

/**
 * 許可リスト外のトラック ID が投稿されたときに投げる Domain Error
 * Zod のバリデーションを通った後も、サーバ側の曲リスト改訂で古いクライアントが未登録 ID を送る経路を塞ぐ
 */
export class UnknownTrack extends Error {
  readonly trackId: string;

  constructor(trackId: string) {
    super(`Unknown BGM track ${trackId}`);
    this.name = "UnknownTrack";
    this.trackId = trackId;
  }
}

/**
 * undo しようとしたが undo 窓が開いていなかったときに投げる Domain Error
 * 直前に誰も操作していない、または既に undo 済みで窓が閉じている状況で発生する
 */
export class UndoUnavailable extends Error {
  constructor() {
    super("No undoable BGM change is available");
    this.name = "UndoUnavailable";
  }
}

/**
 * undo 窓の期限が過ぎた後に undo が要求されたときに投げる Domain Error
 */
export class UndoExpired extends Error {
  constructor() {
    super("The BGM undo window has expired");
    this.name = "UndoExpired";
  }
}

/**
 * 操作者本人が自分の操作を undo しようとしたときに投げる Domain Error
 * 自分でやり直す場合は undo ではなく再度 `set` や `stop` を呼ぶよう誘導するため、意図的に弾く
 */
export class UndoBySelf extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Member ${memberId} cannot undo their own BGM change`);
    this.name = "UndoBySelf";
    this.memberId = memberId;
  }
}
