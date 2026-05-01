import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, MemberLeftPayload, RoomId } from "@play.realtime/contracts";
import { PubSub } from "../shared/ports/pubsub";
import { GlobalTopic } from "../shared/topic";

/**
 * ブラウザの `pagehide` 起点で送られてきた明示退出シグナルを、SSE と WebSocket の両 Hub へ fanout する usecase
 * 自インスタンスに該当メンバーの接続が居るかは関知せず、PubSub への publish だけを責務とする
 * 受信側 (両 Hub の `closeByMember`) が自インスタンスの保持接続だけ強制クローズし、close ハンドラ経由で `RoomPresence.deregister` と機能別 broadcaster を踏ませる
 *
 * `Room.members` は入場名簿として時間的に単調増加する集合のため、ここでは一切更新しない
 * 在室実態は Vibe aggregate が connection 単位で管理しており、明示退出は Vibe 側の deregister と Hub の close だけで完結する
 */
@Injectable()
export class LeaveRoom {
  constructor(@Inject(PubSub) private readonly pubsub: PubSub) {}

  async execute(input: { roomId: RoomId; memberId: MemberId }): Promise<void> {
    const payload: MemberLeftPayload = {
      roomId: input.roomId,
      memberId: input.memberId,
    };
    await this.pubsub.publish(GlobalTopic.MemberLeft, payload);
  }
}
