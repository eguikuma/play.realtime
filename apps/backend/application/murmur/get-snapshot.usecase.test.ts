import type { Murmur, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { MurmurRepository } from "../../domain/murmur";
import { GetMurmurSnapshot } from "./get-snapshot.usecase";

describe("GetMurmurSnapshot", () => {
  it("ルームの直近 50 件の一言をまとめて返す", async () => {
    const items: Murmur[] = [];
    const murmurs: MurmurRepository = {
      save: vi.fn(),
      latest: vi.fn(async () => items),
      remove: vi.fn(),
    };
    const usecase = new GetMurmurSnapshot(murmurs);
    const roomId = "room-abc-1234" as RoomId;

    const result = await usecase.execute({ roomId });

    expect(result).toBe(items);
    expect(murmurs.latest).toHaveBeenCalledWith(roomId, 50);
  });
});
