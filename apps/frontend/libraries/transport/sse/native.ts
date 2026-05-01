import type { z } from "zod";
import { SseValidationFailed } from "./errors";
import { type SseClient, type SseConnection, type SseEvents, SseState } from "./port";

/**
 * ブラウザ native `EventSource` を使った `SseClient` の実装を生成するファクトリ
 * Cookie を同送するため `withCredentials: true` を固定で指定し、ブラウザ組み込みの自動再接続に挙動を委ねる
 * JSON パース失敗や Zod 検証失敗はログを残すだけで他イベントへの配信は止めない、1 件の不正ペイロードでストリーム全体を壊さない
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
