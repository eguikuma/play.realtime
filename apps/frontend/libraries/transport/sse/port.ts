import type { z } from "zod";

export const SseState = {
  Connecting: "connecting",
  Open: "open",
  Closed: "closed",
  Error: "error",
} as const;

export type SseState = (typeof SseState)[keyof typeof SseState];

export type SseEvents = Record<string, z.ZodTypeAny>;

export type SseConnection = {
  close(): void;
};

export type SseClient = {
  connect<TMap extends SseEvents>(parameters: {
    url: string;
    events: TMap;
    onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
    onStateChange?: (state: SseState) => void;
  }): SseConnection;
};
