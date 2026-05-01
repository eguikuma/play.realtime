import type { z } from "zod";

import { WsValidationFailed } from "./errors";
import { type WsClient, type WsConnection, type WsEvents, WsState } from "./port";

type Envelope = {
  name: string;
  data: unknown;
};

export const createNativeWsClient = (): WsClient => {
  return {
    connect: <TMap extends WsEvents>({
      url,
      events,
      onEvent,
      onStateChange,
    }: {
      url: string;
      events: TMap;
      onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
      onStateChange?: (state: WsState) => void;
    }): WsConnection => {
      const socket = new WebSocket(url);
      onStateChange?.(WsState.Connecting);

      socket.onopen = () => {
        onStateChange?.(WsState.Open);
      };

      socket.onerror = () => {
        onStateChange?.(WsState.Error);
      };

      socket.onclose = () => {
        onStateChange?.(WsState.Closed);
      };

      socket.onmessage = (message: MessageEvent<string>) => {
        const envelope = parse(message.data);
        if (!envelope) {
          return;
        }
        if (envelope.name === "Ping") {
          send(socket, "Pong", {});
          return;
        }
        const shape = events[envelope.name];
        if (!shape) {
          return;
        }
        const parsed = shape.safeParse(envelope.data);
        if (!parsed.success) {
          console.warn(new WsValidationFailed(envelope.name, parsed.error));
          return;
        }
        onEvent(envelope.name as keyof TMap, parsed.data as z.infer<TMap[keyof TMap]>);
      };

      return {
        send: (name, data) => {
          send(socket, name, data);
        },
        close: () => {
          socket.close();
        },
      };
    },
  };
};

const send = <TData>(socket: WebSocket, name: string, data: TData): void => {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }
  try {
    socket.send(JSON.stringify({ name, data }));
  } catch {}
};

const parse = (raw: string): Envelope | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("name" in parsed) ||
      typeof (parsed as { name: unknown }).name !== "string"
    ) {
      return null;
    }
    const value = parsed as { name: string; data?: unknown };
    return { name: value.name, data: value.data };
  } catch {
    return null;
  }
};
