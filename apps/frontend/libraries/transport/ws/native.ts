import type { z } from "zod";

import { WsValidationFailed } from "./errors";
import { type WsClient, type WsConnection, type WsEvents, WsState } from "./port";

/**
 * WebSocket の通信路で流れる 1 フレームの包み
 * サーバー側とクライアント側が同じ形状で JSON に直列化する前提とする
 */
type Envelope = {
  name: string;
  data: unknown;
};

/**
 * ブラウザの WebSocket を使った WebSocket クライアント実装を組み立てる
 * ピング受信時は即座にポンを返して サーバー側の心拍を維持する
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
 * ソケットの状態が開いているときだけ包みを送る内部ヘルパー
 * 送信時の例外は握りつぶし 呼び出し側には失敗を伝えない
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
 * 受信した生文字列を包みへ緩く変換する
 * 名前が文字列でない不正なフレームはなしを返し 呼び出し側で無視させる
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
