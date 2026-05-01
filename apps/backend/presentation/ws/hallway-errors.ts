import { HallwayErrorCode } from "@play.realtime/contracts";

export const hallwayErrorCodeOf = (error: unknown): HallwayErrorCode | null => {
  if (!(error instanceof Error)) {
    return null;
  }
  const parsed = HallwayErrorCode.safeParse(error.name);
  return parsed.success ? parsed.data : null;
};
