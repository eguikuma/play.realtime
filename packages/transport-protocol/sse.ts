export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;

export const SSE_RETRY_MS = 3_000;

export const SSE_CONTENT_TYPE = "text/event-stream";

export const SseEventName = {
  Snapshot: "snapshot",
  Update: "update",
  Heartbeat: "heartbeat",
} as const;
export type SseEventName = (typeof SseEventName)[keyof typeof SseEventName];
