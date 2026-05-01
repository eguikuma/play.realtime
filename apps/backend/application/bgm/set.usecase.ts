import { Inject, Injectable } from "@nestjs/common";
import type { BgmState, MemberId, RoomId, TrackId } from "@play.realtime/contracts";
import { BgmRepository, empty, set } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

/**
 * BGM を設定してルーム全員に `Changed` を配信するユースケース
 * ドメインの設定処理を経由することで undo 窓の開設と `UnknownTrack` の検証を保証する
 */
@Injectable()
export class SetBgm {
  /**
   * ルームと BGM の 2 つの永続化ポートと SSE ハブを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
    private readonly hub: SseHub,
  ) {}

  /**
   * 現状の取得から始まり ドメインの設定処理 保存 配信の順で BGM を設定する
   * ルームが存在しない場合は `RoomNotFound` を投げ ドメインの検証失敗は `UnknownTrack` が伝わる
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
