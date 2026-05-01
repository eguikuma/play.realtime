import type { z } from "zod";

import { type WsClient, type WsConnection, type WsEvents, WsState } from "./port";

const BACKOFF_MIN_MS = 1_000;
const BACKOFF_MAX_MS = 16_000;

/**
 * 既存の `WsClient` を装飾して切断耐性を加えるクライアントを生成するファクトリ
 * サーバ起因の onclose や onerror、モバイル Safari の background 化で切れた接続を自動で張り直す
 * `document visibilitychange` で foreground 復帰、`window online` でネットワーク復旧をフックして待ち時間を待たずに張り直す
 * 利用側が `close()` を呼んだ後は再接続しない
 */
export const createResilientWsClient = (inner: WsClient): WsClient => {
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
      let attempt = 0;
      let retryTimer: ReturnType<typeof setTimeout> | null = null;
      let lastState: WsState = WsState.Connecting;
      let closedByUser = false;

      const cancelRetry = () => {
        if (retryTimer === null) return;
        clearTimeout(retryTimer);
        retryTimer = null;
      };

      const open = (): WsConnection =>
        inner.connect({
          url,
          events,
          onEvent,
          onStateChange: (next) => {
            lastState = next;
            if (next === WsState.Open) attempt = 0;
            onStateChange?.(next);
            if (closedByUser) return;
            if (next === WsState.Closed || next === WsState.Error) schedule();
          },
        });

      const schedule = () => {
        if (closedByUser || retryTimer !== null) return;
        const delay = Math.min(BACKOFF_MIN_MS * 2 ** attempt, BACKOFF_MAX_MS);
        attempt += 1;
        retryTimer = setTimeout(() => {
          retryTimer = null;
          if (!closedByUser) current = open();
        }, delay);
      };

      const reconnectNow = () => {
        if (closedByUser) return;
        if (lastState === WsState.Open || lastState === WsState.Connecting) return;
        cancelRetry();
        attempt = 0;
        current = open();
      };

      const onVisibility = () => {
        if (document.visibilityState === "visible") reconnectNow();
      };
      const onOnline = () => reconnectNow();

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibility);
      }
      if (typeof window !== "undefined") {
        window.addEventListener("online", onOnline);
      }

      let current = open();

      return {
        send: (name, data) => {
          current.send(name, data);
        },
        close: () => {
          closedByUser = true;
          cancelRetry();
          if (typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", onVisibility);
          }
          if (typeof window !== "undefined") {
            window.removeEventListener("online", onOnline);
          }
          current.close();
        },
      };
    },
  };
};
