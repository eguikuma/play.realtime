import type { z } from "zod";

import { SseValidationFailed } from "./errors";
import { type SseClient, type SseConnection, type SseEvents, SseState } from "./port";

/**
 * ブラウザの EventSource を使った SSE クライアント実装を組み立てる
 * 対応表に登録されたイベント名だけを購読し 検証失敗はコンソール警告として握りつぶす
 */
export const createNativeSseClient = (): SseClient => {
  return {
    connect: <TMap extends SseEvents>({
      url,
      events,
      onEvent,
      onStateChange,
    }: {
      url: string;
      events: TMap;
      onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
      onStateChange?: (state: SseState) => void;
    }): SseConnection => {
      const source = new EventSource(url, { withCredentials: true });
      onStateChange?.(SseState.Connecting);

      source.onopen = () => {
        onStateChange?.(SseState.Open);
      };

      source.onerror = () => {
        onStateChange?.(
          source.readyState === EventSource.CLOSED ? SseState.Closed : SseState.Error,
        );
      };

      /**
       * ある 1 つのイベント名に対しリスナーを登録する内部ヘルパー
       * JSON 解析か Zod 検証のどちらかで失敗したら 警告に落として UI には到達させない
       */
      const register = <K extends keyof TMap & string>(name: K, shape: TMap[K]) => {
        source.addEventListener(name, (message) => {
          let payload: unknown;
          try {
            payload = JSON.parse((message as MessageEvent<string>).data);
          } catch (error) {
            console.warn(new SseValidationFailed(name, error));
            return;
          }
          const parsed = shape.safeParse(payload);
          if (!parsed.success) {
            console.warn(new SseValidationFailed(name, parsed.error));
            return;
          }
          onEvent(name, parsed.data);
        });
      };

      for (const name of Object.keys(events) as Array<keyof TMap & string>) {
        const shape = events[name];
        if (shape !== undefined) register(name, shape);
      }

      return {
        close: () => {
          source.close();
          onStateChange?.(SseState.Closed);
        },
      };
    },
  };
};
