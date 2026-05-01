import type { MemberId, RoomId } from "@play.realtime/contracts";
import { SSE_CONTENT_TYPE, SSE_RETRY_MS } from "@play.realtime/transport-protocol";
import type { Response } from "express";

/**
 * 生 Express `Response` を SSE ストリームとして扱うラッパ
 * 学習目的から NestJS の `@Sse()` デコレータを使わず、ヘッダ / `retry` / `id` / `event` / `data` の組み立てを自前で行う
 * `close` が多重に走っても 2 回目以降は静かに no-op になるよう内部フラグで冪等性を確保する
 */
export class SseConnection {
  private closed = false;

  constructor(
    readonly id: string,
    readonly memberId: MemberId,
    readonly roomId: RoomId,
    private readonly response: Response,
  ) {
    this.response.on("close", () => {
      this.closed = true;
    });
  }

  /**
   * SSE のヘッダを送出してストリームを開く
   * `X-Accel-Buffering: no` はリバースプロキシでの応答バッファ無効化、`retry` はクライアント自動再接続の待機時間を共通定数で明示する
   */
  open(): void {
    if (this.closed) {
      return;
    }
    this.response.setHeader("Content-Type", SSE_CONTENT_TYPE);
    this.response.setHeader("Cache-Control", "no-cache, no-transform");
    this.response.setHeader("Connection", "keep-alive");

    this.response.setHeader("X-Accel-Buffering", "no");
    this.response.flushHeaders();
    this.retry(SSE_RETRY_MS);
  }

  /**
   * `: ` で始まる SSE コメント行を送る、heartbeat や接続確認のダミー送出に使う
   */
  comment(text: string): void {
    this.write(`: ${text}\n\n`);
  }

  /**
   * クライアント自動再接続の待機時間をミリ秒で指示する `retry` フィールドを送る
   */
  retry(milliseconds: number): void {
    this.write(`retry: ${milliseconds}\n\n`);
  }

  /**
   * 1 件のイベントを `id` / `event` / `data` の SSE フレームとして送る
   * `data` は改行を含む JSON を複数 `data:` 行へ分割するためペイロード中の改行も安全に扱える
   */
  emit<T>(name: string, data: T, id?: string): void {
    const json = JSON.stringify(data);
    const lines: string[] = [];
    if (id !== undefined) {
      lines.push(`id: ${id}`);
    }
    lines.push(`event: ${name}`);
    for (const line of json.split("\n")) {
      lines.push(`data: ${line}`);
    }
    this.write(`${lines.join("\n")}\n\n`);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.response.end();
  }

  /**
   * 接続が閉じたときに呼ぶコールバックを登録する、`SseHub` が購読解除と heartbeat 停止に使う
   */
  onClose(callback: () => void): void {
    this.response.on("close", callback);
  }

  /**
   * 書き込み時の例外は内部フラグを閉状態に倒すだけで再送しない、既に切断済みの接続へ書き続けて伝播した例外が hub を壊さないようにする
   */
  private write(chunk: string): void {
    if (this.closed) {
      return;
    }
    try {
      this.response.write(chunk);
    } catch {
      this.closed = true;
    }
  }
}
