/**
 * SSE のイベントペイロードが Zod schema で拒否されたときに作る例外
 * イベント名とバリデーションエラーを束ね、呼び出し側は `console.warn` でログに残すだけで throw せず、他イベントの配信を止めない
 */
export class SseValidationFailed extends Error {
  readonly event: string;

  constructor(event: string, cause: unknown) {
    super(
      `sse event validation failed for "${event}"`,
      cause !== undefined ? { cause } : undefined,
    );
    this.name = "SseValidationFailed";
    this.event = event;
  }
}
