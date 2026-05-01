import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";

import { type WsClient, type WsConnection, type WsEvents, WsState } from "./port";

/**
 * React コンポーネントから WebSocket 接続を宣言的に張るフック
 * URL がなしの間は接続を張らず 受信コールバックは常に最新の値を参照する ref 経由で呼ぶ
 * 送信関数は描画後も安定した関数参照として返し 依存配列由来の副作用を抑える
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
  const latest = useRef(onEvent);
  latest.current = onEvent;
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
        latest.current(name, payload);
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
