import { Inject, Injectable } from "@nestjs/common";
import type { Murmur, RoomId } from "@play.realtime/contracts";
import { MurmurRepository } from "../../domain/murmur";

/**
 * スナップショットで返す直近投稿の上限件数
 * SSE 接続直後の起動処理の負荷を一定以下に抑えるために打ち切る値とする
 */
const LATEST_LIMIT = 50;

/**
 * SSE の購読開始時の起動処理として 直近のひとこと投稿を返すユースケース
 */
@Injectable()
export class GetMurmurSnapshot {
  /**
   * ひとこと投稿の永続化ポートを依存性注入で受け取る
   */
  constructor(@Inject(MurmurRepository) private readonly murmurs: MurmurRepository) {}

  /**
   * 指定したルームの最新 50 件を時刻降順で返す
   */
  async execute(input: { roomId: RoomId }): Promise<Murmur[]> {
    return this.murmurs.latest(input.roomId, LATEST_LIMIT);
  }
}
