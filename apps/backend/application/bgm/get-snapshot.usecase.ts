import { Inject, Injectable } from "@nestjs/common";
import type { BgmSnapshot, RoomId } from "@play.realtime/contracts";
import { BgmRepository, empty } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";

/**
 * SSE の購読開始時の起動処理として 最新の BGM 状態を返すユースケース
 * 未設定のルームではドメインの空状態生成を通して 無音かつ undo 不可の初期状態を返す
 */
@Injectable()
export class GetBgmSnapshot {
  /**
   * ルームと BGM の 2 つの永続化ポートを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
  ) {}

  /**
   * 指定したルームの BGM スナップショットを返す
   * ルームが存在しない場合は `RoomNotFound` を投げる
   */
  async execute(input: { roomId: RoomId }): Promise<BgmSnapshot> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const state = (await this.bgms.get(input.roomId)) ?? empty();
    return { state };
  }
}
