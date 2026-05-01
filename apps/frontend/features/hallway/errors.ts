import type { HallwayErrorCode } from "@play.realtime/contracts";

/**
 * 廊下トークの命令失敗コードに対応する 通知として出す短いメッセージ
 * 文言は UI の温度に寄せて用意し 技術用語は避ける
 */
export const hallwayErrorMessages: Record<HallwayErrorCode, string> = {
  SelfInviteNotAllowed: "自分には話しかけられません",
  InviterBusy: "今は他の通話中です",
  InviteeUnavailable: "相手が取り込み中です",
  InvitationNotFound: "招待はすでに終了しています",
  CallNotFound: "通話は終了しました",
  NotCallParticipant: "この通話の参加者ではありません",
};
