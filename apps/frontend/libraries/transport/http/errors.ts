/**
 * HTTP 応答が失敗したことを表す例外
 * 状態コードとメッセージを添えて呼び出し側に拾わせ UI 文言や再試行判定の材料にする
 */
export class HttpFailure extends Error {
  /** 受信した HTTP 状態コードを持つ */
  readonly status: number;

  /**
   * HTTP 状態コードとメッセージを添えて例外を組み立てる
   */
  constructor(status: number, message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "HttpFailure";
    this.status = status;
  }
}
