import { Inject, Injectable } from "@nestjs/common";
import type { BgmState, MemberId, RoomId } from "@play.realtime/contracts";
import { BgmRepository, empty, stop } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { BgmBroadcaster } from "./broadcaster";
import { topic } from "./topic";

/**
 * BGM を停止して無音状態にする usecase
 * ドメイン関数 `stop` で `current` を `null` に落とし、直前状態を undo 窓に退避してから保存して `Changed` を配信する
 */
@Injectable()
export class StopBgm {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
    private readonly broadcaster: BgmBroadcaster,
  ) {}

  async execute(input: { roomId: RoomId; memberId: MemberId; now: Date }): Promise<BgmState> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const current = (await this.bgms.get(input.roomId)) ?? empty();
    const next = stop(current, { memberId: input.memberId, now: input.now });
    await this.bgms.save(input.roomId, next);
    await this.broadcaster.broadcast(topic(input.roomId), "Changed", { state: next });
    return next;
  }
}
