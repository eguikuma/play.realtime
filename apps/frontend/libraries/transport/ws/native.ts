import type { z } from "zod";
import { WsValidationFailed } from "./errors";
import { type WsClient, type WsConnection, type WsEvents, WsState } from "./port";

/**
 * サーバとクライアントで形を揃えた 2 段封筒、`name` と `data` の 2 フィールド固定
 */
type Envelope = {
  name: string;
  data: unknown;
};

/**
 * ブラウザ native `WebSocket` を使った `WsClient` の実装を生成するファクトリ
 * サーバからの `Ping` には自動で `Pong` を返してハートビート応答責任を接続内部に閉じ込め、使用側は業務メッセージだけに集中できる
 * JSON パース失敗や Zod 検証失敗は console.warn を残すだけで他メッセージの処理は継続する
 */
export const createNativeWsClient = (): WsClient => {
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
      const socket = new WebSocket(url);
      onStateChange?.(WsState.Connecting);

      socket.onopen = () => {
        onStateChange?.(WsState.Open);
      };

      socket.onerror = () => {
        onStateChange?.(WsState.Error);
      };

      socket.onclose = () => {
        onStateChange?.(WsState.Closed);
      };

      socket.onmessage = (message: MessageEvent<string>) => {
        const envelope = parse(message.data);
        if (!envelope) {
          return;
        }
        if (envelope.name === "Ping") {
          send(socket, "Pong", {});
          return;
        }
        const shape = events[envelope.name];
        if (!shape) {
          return;
        }
        const parsed = shape.safeParse(envelope.data);
        if (!parsed.success) {
          console.warn(new WsValidationFailed(envelope.name, parsed.error));
          return;
        }

        onEvent(envelope.name as keyof TMap, parsed.data as z.infer<TMap[keyof TMap]>);
      };

      return {
        send: (name, data) => {
          send(socket, name, data);
        },
        close: () => {
          socket.close();
        },
      };
    },
  };
};

/**
 * 接続が `OPEN` のときのみ送信を試みる
 * 送信例外は飲み込んで切断検知を `onclose` に任せる
 */
const send = <TData>(socket: WebSocket, name: string, data: TData): void => {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }
  try {
    socket.send(JSON.stringify({ name, data }));
  } catch {}
};

/**
 * 受信文字列を `Envelope` 形状に緩くパースする
 * JSON パース失敗、非オブジェクト、`name` が string でないいずれかで `null` を返す
 */
const parse = (raw: string): Envelope | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("name" in parsed) ||
      typeof (parsed as { name: unknown }).name !== "string"
    ) {
      return null;
    }
    const value = parsed as { name: string; data?: unknown };
    return { name: value.name, data: value.data };
  } catch {
    return null;
  }
};
