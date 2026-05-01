import type { z } from "zod";

export const WsState = {
  Connecting: "connecting",
  Open: "open",
  Closed: "closed",
  Error: "error",
} as const;

export type WsState = (typeof WsState)[keyof typeof WsState];

export type WsEvents = Record<string, z.ZodTypeAny>;

export type WsConnection = {
  send: <TData>(name: string, data: TData) => void;
  close: () => void;
};

export type WsClient = {
  connect: <TMap extends WsEvents>(parameters: {
    url: string;
    events: TMap;
    onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
    onStateChange?: (state: WsState) => void;
  }) => WsConnection;
};
