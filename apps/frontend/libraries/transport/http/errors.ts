/**
 * HTTP 呼び出しが失敗したときに投げる例外
 * `status` にはサーバが返したステータス、`cause` には Zod バリデーションエラーや fetch の原因エラーなど詳細を追跡できる元情報を載せる
 */
export class HttpFailure extends Error {
  readonly status: number;

  constructor(status: number, message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "HttpFailure";
    this.status = status;
  }
}
