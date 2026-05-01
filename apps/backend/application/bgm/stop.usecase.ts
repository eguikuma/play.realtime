import { Inject, Injectable } from "@nestjs/common";
import type { BgmState, MemberId, RoomId } from "@play.realtime/contracts";
import { BgmRepository, empty, stop } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

/**
 * BGM を無音に切り替えてルーム全員に `Changed` を配信するユースケース
 * ドメインの停止処理を経由することで undo 窓を開きつつ 直前の曲を取り消し候補として退避する
 */
@Injectable()
export class StopBgm {
  /**
   * ルームと BGM の 2 つの永続化ポートと SSE ハブを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
    private readonly hub: SseHub,
  ) {}

  /**
   * 現状の取得から始まり ドメインの停止処理 保存 配信の順で BGM を無音化する
   * ルームが存在しない場合は `RoomNotFound` を投げる
   */
  async execute(input: { roomId: RoomId; memberId: MemberId; now: Date }): Promise<BgmState> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const current = (await this.bgms.get(input.roomId)) ?? empty();
    const next = stop(current, { memberId: input.memberId, now: input.now });
    await this.bgms.save(input.roomId, next);
    await this.hub.broadcast(topic(input.roomId), "Changed", { state: next });
    return next;
  }
}
