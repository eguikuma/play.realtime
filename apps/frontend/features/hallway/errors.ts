import type { HallwayErrorCode } from "@play.realtime/contracts";

/**
 * `CommandFailed` の `code` を UI の toast 文言に対応付けるマップ
 * サーバから来る英語コードをそのまま出さず、ユーザに伝わる平易な日本語へ一元的に翻訳する
 */
export const hallwayErrorMessages: Record<HallwayErrorCode, string> = {
  SelfInviteNotAllowed: "自分には話しかけられません",
  InviterBusy: "今は他の通話中です",
  InviteeUnavailable: "相手が取り込み中です",
  InvitationNotFound: "招待はすでに終了しています",
  CallNotFound: "通話は終了しました",
  NotCallParticipant: "この通話の参加者ではありません",
};
