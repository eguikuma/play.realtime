import { Inject, Injectable } from "@nestjs/common";
import type { Murmur, RoomId } from "@play.realtime/contracts";
import { MurmurRepository } from "../../domain/murmur";

/**
 * SSE 購読開始直後に `Snapshot` として配信する投稿件数の上限
 * 遅れて参加したクライアントでも過去の流れを追えつつ、初回ペイロードが極端に膨らまない塩梅で 50 件にしている
 */
const LATEST_LIMIT = 50;

/**
 * 購読開始時に配信する Murmur スナップショットを取得する usecase
 * 最新 50 件を古い順に並べた配列で返し、クライアントはそのままタイムラインへ展開する
 */
@Injectable()
export class GetMurmurSnapshot {
  constructor(@Inject(MurmurRepository) private readonly murmurs: MurmurRepository) {}

  async execute(input: { roomId: RoomId }): Promise<Murmur[]> {
    return this.murmurs.latest(input.roomId, LATEST_LIMIT);
  }
}
