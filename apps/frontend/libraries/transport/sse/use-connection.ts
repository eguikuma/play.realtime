import { useEffect, useRef, useState } from "react";
import type { z } from "zod";

import { type SseClient, type SseEvents, SseState } from "./port";

/**
 * React コンポーネントから SSE 接続を宣言的に張るフック
 * URL がなしの間は接続を張らず 受信コールバックは常に最新の値を参照する ref 経由で呼ぶ
 */
export const useSse = <TMap extends SseEvents>({
  client,
  url,
  events,
  onEvent,
}: {
  client: SseClient;
  url: string | null;
  events: TMap;
  onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
}): { state: SseState } => {
  const [state, setState] = useState<SseState>(SseState.Closed);
  const latest = useRef(onEvent);
  latest.current = onEvent;

  useEffect(() => {
    if (!url) {
      setState(SseState.Closed);
      return;
    }

    const connection = client.connect({
      url,
      events,
      onEvent: (name, payload) => latest.current(name, payload),
      onStateChange: setState,
    });

    return () => {
      connection.close();
    };
  }, [client, url, events]);

  return { state };
};
