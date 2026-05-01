import { Injectable } from "@nestjs/common";
import type { Murmur, MurmurId, RoomId } from "@play.realtime/contracts";
import { SseHub } from "../../infrastructure/transport/sse";
import { Topic } from "./topic";

/**
 * ひとこと SSE 配信のイベント別ファサード
 * usecase 層は `SseHub` を直接触らずこの broadcaster の各メソッド経由で配信し、辞書にないキーや payload 不一致をシグネチャ単位でコンパイル時に弾く
 * `RoomId` から `MurmurTopic` への変換も内部に閉じ込め、usecase からトピック組み立ての関心を取り除く
 */
@Injectable()
export class MurmurBroadcaster {
  constructor(private readonly hub: SseHub) {}

  /**
   * 新しいひとこと投稿をルームの購読者全員に配信する
   * `id` は SSE の `Last-Event-ID` 再送起点として `MurmurId` を渡す
   */
  async posted(roomId: RoomId, data: Murmur, id: MurmurId): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "Posted", data, id);
  }
}
