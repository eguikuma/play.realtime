import type { VibeStatus } from "@play.realtime/contracts";

export const aggregate = (statuses: VibeStatus[]): VibeStatus => {
  return statuses.includes("present") ? "present" : "focused";
};
