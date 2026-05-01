/**
 * WebSocket のイベントペイロードが Zod schema で拒否されたときに作る例外
 * イベント名とバリデーションエラーを束ねて `console.warn` のログ出力に載せ、throw せず他メッセージの処理を続ける
 */
export class WsValidationFailed extends Error {
  readonly event: string;

  constructor(event: string, cause: unknown) {
    super(`ws event validation failed for "${event}"`, cause !== undefined ? { cause } : undefined);
    this.name = "WsValidationFailed";
    this.event = event;
  }
}
