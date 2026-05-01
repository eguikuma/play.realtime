import {
  HallwayClientMessages,
  type HallwayCommandName,
  type MemberId,
  type RoomId,
} from "@play.realtime/contracts";
import type { z } from "zod";
import type { WsConnection } from "../../infrastructure/transport/ws";
import { hallwayErrorCodeOf, isHallwayCommand } from "./hallway-errors";

/**
 * ハンドラが参照する接続ごとの文脈
 * ルーム ID と操作主体のメンバー ID を 1 箱に束ねて渡す
 */
export type HallwayHandlerContext = { roomId: RoomId; memberId: MemberId };

/**
 * クライアント命令名ごとに対応するハンドラ関数の対応表
 * `satisfies` で列挙の完全性を型で担保し 命令追加時に未実装のハンドラをコンパイル時点で検出できるようにする
 */
export type HallwayCommandHandlers = {
  [K in HallwayCommandName]: (input: {
    context: HallwayHandlerContext;
    data: z.infer<(typeof HallwayClientMessages)[K]>;
  }) => Promise<void>;
};

/**
 * dispatch で利用するロガーの最小面
 * 本番は NestJS の `Logger` を テストでは vi.fn の組を差し替えて渡す
 */
export type HallwayDispatchLogger = {
  debug: (message: string) => void;
  warn: (message: string) => void;
};

/**
 * 受信した包みの名前で分岐し 対応するハンドラへ橋渡しする純粋関数
 * 未知の名前は debug ログへ逃がし ドメイン例外は操作本人の接続だけへ `CommandFailed` を直送する
 * 非ドメイン例外は握りつぶして警告ログに流し 接続自体はいずれの場合も維持する
 */
export const dispatchHallwayCommand = async (params: {
  connection: WsConnection;
  envelope: { name: string; data: unknown };
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
