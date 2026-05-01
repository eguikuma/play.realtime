/**
 * WebSocket イベントのペイロード検証失敗を表す例外
 * イベント名と原因を添えてコンソール警告に出力し UI 側の処理には影響させない
 */
export class WsValidationFailed extends Error {
  /** 検証に失敗したイベント名を持つ */
  readonly event: string;

  /**
   * 対象のイベント名と原因を添えて例外を組み立てる
   */
  constructor(event: string, cause: unknown) {
    super(`ws event validation failed for "${event}"`, cause !== undefined ? { cause } : undefined);
    this.name = "WsValidationFailed";
    this.event = event;
  }
}
