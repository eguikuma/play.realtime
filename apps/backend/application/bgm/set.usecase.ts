import { Inject, Injectable } from "@nestjs/common";
import type { BgmState, MemberId, RoomId, TrackId } from "@play.realtime/contracts";
import { BgmRepository, empty, set } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

/**
 * BGM の再生トラックを切り替える usecase
 * 現在状態を取得、ドメイン関数 `set` で undo 窓付きの新状態を組み立て、保存後に `Changed` を配信する
 */
@Injectable()
export class SetBgm {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
    private readonly hub: SseHub,
  ) {}

  /**
   * ルーム存在確認、現在状態取得、ドメイン `set` 適用、保存、SSE 配信の順で流れる
   * 保存済み状態が `null` の初回は `empty()` を起点にする
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    trackId: TrackId;
    now: Date;
  }): Promise<BgmState> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const current = (await this.bgms.get(input.roomId)) ?? empty();
    const next = set(current, {
      trackId: input.trackId,
      memberId: input.memberId,
      now: input.now,
    });
    await this.bgms.save(input.roomId, next);
    await this.hub.broadcast(topic(input.roomId), "Changed", { state: next });
    return next;
  }
}
