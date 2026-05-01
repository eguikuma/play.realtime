import { Inject, Injectable } from "@nestjs/common";
import type { BgmState, MemberId, RoomId } from "@play.realtime/contracts";
import { BgmRepository, empty, undo } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { BgmBroadcaster } from "./broadcaster";

/**
 * BGM の直前操作を取り消して、undo 窓に退避された `previous` へ戻す usecase
 * ドメイン関数 `undo` が `UndoUnavailable`、`UndoExpired`、`UndoBySelf` を投げるため、usecase 側では追加の検証を行わない
 */
@Injectable()
export class UndoBgm {
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
    const next = undo(current, { memberId: input.memberId, now: input.now });
    await this.bgms.save(input.roomId, next);

    await this.broadcaster.changed(input.roomId, { state: next });

    return next;
  }
}
