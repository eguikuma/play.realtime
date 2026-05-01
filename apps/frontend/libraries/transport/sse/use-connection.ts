import { useEffect, useRef, useState } from "react";
import type { z } from "zod";

import { type SseClient, type SseEvents, SseState } from "./port";

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
