import {
  HallwayClientMessages,
  HallwayCommandName,
  type MemberId,
  type RoomId,
} from "@play.realtime/contracts";
import type { z } from "zod";
import type { WsConnection } from "../../infrastructure/transport/ws";
import { hallwayErrorCodeOf } from "./hallway-errors";

export const isHallwayCommand = (name: string): name is HallwayCommandName =>
  HallwayCommandName.safeParse(name).success;

export type HallwayHandlerContext = { roomId: RoomId; memberId: MemberId };

export type HallwayCommandHandlers = {
  [K in HallwayCommandName]: (input: {
    context: HallwayHandlerContext;
    data: z.infer<(typeof HallwayClientMessages)[K]>;
  }) => Promise<void>;
};

export type HallwayDispatchLogger = {
  debug: (message: string) => void;
  warn: (message: string) => void;
};

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
