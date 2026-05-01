import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { type WsClient, type WsConnection, type WsEvents, WsState } from "./port";

/**
 * WebSocket 接続 1 本を React の Effect ライフサイクルに同期させるフック
 * `url` が `null` のときは接続せず `Closed` を返し、URL が変わるたびに旧接続を閉じて新しい接続を張り直す
 * `send` は `useCallback` で安定参照を返し、依存の発火で再描画を巻き込まないようにしている
 */
export const useWs = <TMap extends WsEvents>({
  client,
  url,
  events,
  onEvent,
}: {
  client: WsClient;
  url: string | null;
  events: TMap;
  onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
}): {
  state: WsState;
  send: <TData>(name: string, data: TData) => void;
} => {
  const [state, setState] = useState<WsState>(WsState.Closed);
  const latestOnEvent = useRef(onEvent);
  latestOnEvent.current = onEvent;
  const connection = useRef<WsConnection | null>(null);

  useEffect(() => {
    if (!url) {
      setState(WsState.Closed);
      return;
    }

    const current = client.connect({
      url,
      events,
      onEvent: (name, payload) => {
        latestOnEvent.current(name, payload);
      },
      onStateChange: setState,
    });
    connection.current = current;

    return () => {
      current.close();
      connection.current = null;
    };
  }, [client, url, events]);

  const send = useCallback(<TData>(name: string, data: TData): void => {
    connection.current?.send(name, data);
  }, []);

  return { state, send };
};
