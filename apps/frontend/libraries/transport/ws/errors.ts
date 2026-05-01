export class WsValidationFailed extends Error {
  readonly event: string;

  constructor(event: string, cause: unknown) {
    super(`ws event validation failed for "${event}"`, cause !== undefined ? { cause } : undefined);
    this.name = "WsValidationFailed";
    this.event = event;
  }
}
