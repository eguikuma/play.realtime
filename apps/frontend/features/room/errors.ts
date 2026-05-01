import { HttpFailure } from "@/libraries/transport/http";

export const isMissing = (failure: unknown): boolean =>
  failure instanceof HttpFailure && (failure.status === 404 || failure.status === 400);
