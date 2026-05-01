import type { MemberId, RoomId } from "@play.realtime/contracts";
import type { RawData, WebSocket } from "ws";

/**
 * WebSocket の通信路で送受信するイベント 1 件ぶんの包み
 * Zod 検証を掛ける前の素の構造であり 名前についてはサーバー側もクライアント側も文字列とする
 */
type Envelope = {
  name: string;
  data: unknown;
};

/**
 * 1 接続ぶんの WebSocket を表す
 * 生の ws ライブラリを直接叩き 送信 終了 メッセージ受信 切断検知の薄い入口だけを露出する
 */
export class WsConnection {
  /**
   * 終了後の多重送信を防ぐためのフラグ
   */
  private closed = false;

  /**
   * 接続の識別子と対象ルームとメンバー そして ws ライブラリの WebSocket 本体を受け取る
   * コンストラクタで終了イベントを購読し 切断検知を即時に反映する
   */
  constructor(
    readonly id: string,
    readonly memberId: MemberId,
    readonly roomId: RoomId,
    private readonly socket: WebSocket,
  ) {
    this.socket.on("close", () => {
      this.closed = true;
    });
  }

  /**
   * 包みを JSON に変換して 1 フレーム送信する
   * 送信で例外が出たら終了フラグに転写し 以降の送信を止める
   */
  send<T>(name: string, data: T): void {
    if (this.closed) {
      return;
    }
    const envelope: Envelope = { name, data };
    try {
      this.socket.send(JSON.stringify(envelope));
    } catch {
      this.closed = true;
    }
  }

  /**
   * WebSocket 接続を正常終了する 終了コードには `WsCloseCode` 相当の値を渡す
   */
  close(code?: number): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.socket.close(code);
  }

  /**
   * メッセージフレームを受信するたびにハンドラを呼ぶ
   * 文字列化までをここで吸収し 上位は常に文字列を受け取る
   */
  onMessage(handler: (raw: string) => void): void {
    this.socket.on("message", (data: RawData) => {
      handler(typeof data === "string" ? data : data.toString());
    });
  }

  /**
   * クライアント切断を検知するコールバックを登録する
   */
  onClose(callback: () => void): void {
    this.socket.on("close", callback);
  }
}
