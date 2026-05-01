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
