import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, Murmur, RoomId } from "@play.realtime/contracts";
import { MurmurRepository, post } from "../../domain/murmur";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

/**
 * ひとこと投稿を 1 件作成してルーム全員に `Posted` を配信するユースケース
 * ID はサーバーで発行し SSE のイベント ID にも同じ値を使うことで クライアントの重複抑止に活かす
 */
@Injectable()
export class PostMurmur {
  /**
   * 必要な永続化ポートと補助サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(MurmurRepository) private readonly murmurs: MurmurRepository,
    private readonly ids: NanoidIdGenerator,
    private readonly hub: SseHub,
  ) {}

  /**
   * ルームの検証から始まり ドメインの投稿組み立て 保存 配信の順で進める
   * ルームが見つからない場合は `RoomNotFound` を投げる
   */
  async execute(input: { roomId: RoomId; memberId: MemberId; text: string }): Promise<Murmur> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const murmur = post({
      id: this.ids.murmur(),
      roomId: input.roomId,
      memberId: input.memberId,
      text: input.text,
      postedAt: new Date().toISOString(),
    });
    await this.murmurs.save(murmur);
    await this.hub.broadcast(topic(input.roomId), "Posted", murmur, murmur.id);
    return murmur;
  }
}
