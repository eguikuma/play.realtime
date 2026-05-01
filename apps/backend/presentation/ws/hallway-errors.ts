import type { HallwayErrorCode } from "@play.realtime/contracts";
import {
  CallNotFound,
  InvitationNotFound,
  InviteeUnavailable,
  InviterBusy,
  NotCallParticipant,
  SelfInviteNotAllowed,
} from "../../domain/hallway/errors";

/**
 * 廊下トークのドメイン例外 6 種を WebSocket に載せる列挙コードへ引き当てる対応表
 * 新しい例外を追加するときは ここに項目を足し Contracts の列挙も合わせて更新する
 */
const HallwayErrors: ReadonlyArray<{
  match: (error: unknown) => boolean;
  code: HallwayErrorCode;
}> = [
  { match: (error) => error instanceof SelfInviteNotAllowed, code: "SelfInviteNotAllowed" },
  { match: (error) => error instanceof InviterBusy, code: "InviterBusy" },
  { match: (error) => error instanceof InviteeUnavailable, code: "InviteeUnavailable" },
  { match: (error) => error instanceof InvitationNotFound, code: "InvitationNotFound" },
  { match: (error) => error instanceof CallNotFound, code: "CallNotFound" },
  { match: (error) => error instanceof NotCallParticipant, code: "NotCallParticipant" },
];

/**
 * ドメイン例外を列挙コードへ引き当てる
 * 引き当てに外れたときは null を返し 呼び出し側は従来の警告ログ経路に任せる
 */
export const hallwayErrorCodeOf = (error: unknown): HallwayErrorCode | null => {
  const entry = HallwayErrors.find(({ match }) => match(error));
  return entry?.code ?? null;
};
