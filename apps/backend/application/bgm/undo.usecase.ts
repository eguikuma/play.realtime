import { Inject, Injectable } from "@nestjs/common";
import type { BgmState, MemberId, RoomId } from "@play.realtime/contracts";
import { BgmRepository, empty, undo } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

/**
 * 直前の BGM 変更を取り消してルーム全員に `Changed` を配信するユースケース
 * ドメインの undo 処理を経由することで本人 undo の禁止と 時間窓の検証を保証する
 */
@Injectable()
export class UndoBgm {
  /**
   * ルームと BGM の 2 つの永続化ポートと SSE ハブを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
    private readonly hub: SseHub,
  ) {}

  /**
   * 現状の取得から始まり ドメインの undo 処理 保存 配信の順で BGM を直前に戻す
   * ルームが存在しない場合は `RoomNotFound` を投げ ドメインの検証失敗は `UndoBySelf` や `UndoExpired` や `UndoUnavailable` が伝わる
   */
  async execute(input: { roomId: RoomId; memberId: MemberId; now: Date }): Promise<BgmState> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const current = (await this.bgms.get(input.roomId)) ?? empty();
    const next = undo(current, { memberId: input.memberId, now: input.now });
    await this.bgms.save(input.roomId, next);
    await this.hub.broadcast(topic(input.roomId), "Changed", { state: next });
    return next;
  }
}
