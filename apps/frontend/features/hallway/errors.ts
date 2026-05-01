import type { HallwayErrorCode } from "@play.realtime/contracts";

export const hallwayErrorMessages: Record<HallwayErrorCode, string> = {
  SelfInviteNotAllowed: "自分には話しかけられません",
  InviterBusy: "今は他の通話中です",
  InviteeUnavailable: "相手が取り込み中です",
  InvitationNotFound: "招待はすでに終了しています",
  CallNotFound: "通話は終了しました",
  NotCallParticipant: "この通話の参加者ではありません",
};
