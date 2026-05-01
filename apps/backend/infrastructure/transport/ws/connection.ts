import type { ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import type { RawData, WebSocket } from "ws";

/**
 * WebSocket 送受信フレーム 1 通分の共通封筒、クライアント側 `HallwayEnvelope` と同形状を意図的に保つ
 * `WsHub` と presentation 層の dispatch / gateway も同型を参照することで、`name` と `data` の 2 段構造を transport 内で 1 本化する
 */
export type WsEnvelope = {
  name: string;
  data: unknown;
};

/**
 * 生 `ws` ライブラリの `WebSocket` を双方向 transport として扱うラッパ
 * 学習目的から Socket.io などの抽象は避け、`name` と `data` の 2 段封筒を自前でシリアライズする
 * `close` が多重に走っても 2 回目以降は静かに no-op になるよう内部フラグで冪等性を確保する
 */
export class WsConnection {
  private closed = false;

  constructor(
    readonly id: ConnectionId,
    readonly memberId: MemberId,
    readonly roomId: RoomId,
    private readonly socket: WebSocket,
  ) {
    this.socket.on("close", () => {
      this.closed = true;
    });
  }

  /**
   * 1 通分の `WsEnvelope` を JSON にして送る
   * 送信時の例外は内部フラグを閉状態に倒すだけで再送しない
   */
  send<T>(name: string, data: T): void {
    if (this.closed) {
      return;
    }

    const envelope: WsEnvelope = { name, data };
    try {
      this.socket.send(JSON.stringify(envelope));
    } catch {
      this.closed = true;
    }
  }

  /**
   * 接続を閉じる
   * `code` には `WsCloseCode` の値を渡してクライアント側で切断理由を分岐させる
   */
  close(code?: number): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.socket.close(code);
  }

  /**
   * 受信フレームを文字列として中継する
   * `Buffer` で届いた場合も `toString` で正規化してから渡す
   */
  onMessage(handler: (raw: string) => void): void {
    this.socket.on("message", (data: RawData) => {
      handler(typeof data === "string" ? data : data.toString());
    });
  }

  onClose(callback: () => void): void {
    this.socket.on("close", callback);
  }
}
