import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { type SseClient, type SseEvents, SseState } from "./port";

/**
 * SSE 接続 1 本を React の Effect ライフサイクルに同期させるフック
 * `url` が `null` のときは接続せず `Closed` を返し、URL が変わるたびに旧接続を閉じて新しい接続を張り直す
 * `onEvent` は `useRef` 経由で参照するため、依存配列に含めず描画ごとに最新のコールバックを取り出せる
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
  const latestOnEvent = useRef(onEvent);
  latestOnEvent.current = onEvent;

  useEffect(() => {
    if (!url) {
      setState(SseState.Closed);
      return;
    }

    const connection = client.connect({
      url,
      events,
      onEvent: (name, payload) => latestOnEvent.current(name, payload),
      onStateChange: setState,
    });

    return () => {
      connection.close();
    };
  }, [client, url, events]);

  return { state };
};
