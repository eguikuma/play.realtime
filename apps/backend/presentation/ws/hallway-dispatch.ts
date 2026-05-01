import {
  HallwayClientMessages,
  HallwayCommandName,
  type MemberId,
  type RoomId,
} from "@play.realtime/contracts";
import type { z } from "zod";
import type { WsConnection, WsEnvelope } from "../../infrastructure/transport/ws";
import { hallwayErrorCodeOf } from "./hallway-errors";

/**
 * 受信した `envelope.name` が廊下トークの既知コマンドかを判定する type guard
 */
export const isHallwayCommand = (name: string): name is HallwayCommandName =>
  HallwayCommandName.safeParse(name).success;

/**
 * コマンドハンドラへ渡す共通コンテキスト、ルームと送信者メンバーだけに限定することで handler 側の責務を狭める
 */
export type HallwayHandlerContext = { roomId: RoomId; memberId: MemberId };

/**
 * 全コマンドに対応するハンドラマップ、`HallwayClientMessages` の schema から自動導出した型で型付けする
 * `satisfies` で使うことで新しいコマンドの追加時に網羅性を型検査で担保できる
 */
export type HallwayCommandHandlers = {
  [K in HallwayCommandName]: (input: {
    context: HallwayHandlerContext;
    data: z.infer<(typeof HallwayClientMessages)[K]>;
  }) => Promise<void>;
};

/**
 * ディスパッチで使う最小限のロガー型、`Logger` 具象への依存を避けてテストで差し替え可能にする
 */
export type HallwayDispatchLogger = {
  debug: (message: string) => void;
  warn: (message: string) => void;
};

/**
 * 受信 envelope を 1 件ディスパッチする
 * 未知のコマンドは debug ログで静かに捨て、Domain Error は `CommandFailed` として送信元だけに返す
 * それ以外の例外は warn ログを残して黙って止める、他メンバーへは配信しない
 */
export const dispatchHallwayCommand = async (params: {
  connection: WsConnection;
  envelope: WsEnvelope;
  context: HallwayHandlerContext;
  handlers: HallwayCommandHandlers;
  logger: HallwayDispatchLogger;
}): Promise<void> => {
  const { connection, envelope, context, handlers, logger } = params;

  if (!isHallwayCommand(envelope.name)) {
    logger.debug(`unknown message ${envelope.name}`);
    return;
  }

  try {
    const schema = HallwayClientMessages[envelope.name];
    const data = schema.parse(envelope.data);
    const handler = handlers[envelope.name] as (input: {
      context: HallwayHandlerContext;
      data: unknown;
    }) => Promise<void>;
    await handler({ context, data });
  } catch (error: unknown) {
    const code = hallwayErrorCodeOf(error);
    if (code !== null) {
      connection.send("CommandFailed", {
        code,
        command: envelope.name,
        message: (error as Error).message,
      });
      return;
    }
    logger.warn(`dispatch ${envelope.name} failed ${String(error)}`);
  }
};
