export class HttpFailure extends Error {
  readonly status: number;

  constructor(status: number, message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "HttpFailure";
    this.status = status;
  }
}
