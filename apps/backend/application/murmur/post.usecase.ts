import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, Murmur, RoomId } from "@play.realtime/contracts";
import { MurmurRepository, post } from "../../domain/murmur";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { MurmurBroadcaster } from "./broadcaster";

/**
 * ひとこと投稿を受け付けて永続化し、購読中の全クライアントへ `Posted` を配信する usecase
 */
@Injectable()
export class PostMurmur {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(MurmurRepository) private readonly murmurs: MurmurRepository,
    private readonly ids: NanoidIdGenerator,
    private readonly broadcaster: MurmurBroadcaster,
  ) {}

  /**
   * ルームの存在を確認し、ドメイン関数 `post` で投稿を組み立てて保存した後に SSE 配信する
   * 配信時の SSE ID を `murmur.id` に揃えることで、クライアントのリトライ時に `Last-Event-ID` で再配信起点が決まる
   * ルームが見つからなければ `RoomNotFound` を投げる
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

    await this.broadcaster.posted(input.roomId, murmur, murmur.id);

    return murmur;
  }
}
