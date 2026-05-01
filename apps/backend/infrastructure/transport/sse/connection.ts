import type { MemberId, RoomId } from "@play.realtime/contracts";
import { SSE_CONTENT_TYPE, SSE_RETRY_MS } from "@play.realtime/transport-protocol";
import type { Response } from "express";

/**
 * 1 接続ぶんの SSE ストリームを表す
 * text/event-stream の通信路形式を直接書き出す責務を持ち NestJS 標準の `@Sse()` などの抽象は意図的に挟まない
 */
export class SseConnection {
  /**
   * 終了後の多重書き込みを防ぐためのフラグ
   */
  private closed = false;

  /**
   * 接続の識別子と対象ルームとメンバー そして Express の応答を受け取る
   * コンストラクタで終了イベントを購読し 切断検知を即時に反映する
   */
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
   * SSE の応答ヘッダを書き出して接続を確立する
   * 再試行フィールドと X-Accel-Buffering 無効化までをここで一括設定する
   */
  open(): void {
    if (this.closed) {
      return;
    }
    this.response.setHeader("Content-Type", SSE_CONTENT_TYPE);
    this.response.setHeader("Cache-Control", "no-cache, no-transform");
    this.response.setHeader("Connection", "keep-alive");

    /**
     * nginx や類似の逆プロキシによる応答のバッファリングを無効化させる指示
     */
    this.response.setHeader("X-Accel-Buffering", "no");
    this.response.flushHeaders();
    this.retry(SSE_RETRY_MS);
  }

  /**
   * コメント行を書き出す 心拍の用途も兼ねる
   */
  comment(text: string): void {
    this.write(`: ${text}\n\n`);
  }

  /**
   * 再試行フィールドを書き出して クライアントに再接続までの待機時間を指示する
   */
  retry(milliseconds: number): void {
    this.write(`retry: ${milliseconds}\n\n`);
  }

  /**
   * イベント名とペイロードを SSE の形式で書き出す
   * JSON に含まれる改行がイベント境界と衝突しないよう 各行を data 接頭辞で包む
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

  /**
   * ストリームを正常終了させて 以降の書き込みを無視する
   */
  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.response.end();
  }

  /**
   * クライアント切断を検知するコールバックを登録する
   */
  onClose(callback: () => void): void {
    this.response.on("close", callback);
  }

  /**
   * 生のチャンクを応答へ書き出す共通処理
   * 書き込みで例外が出たら終了フラグに転写し 以降の出力を止める
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
