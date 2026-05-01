import { Injectable } from "@nestjs/common";
import type { BgmChanged, RoomId } from "@play.realtime/contracts";
import { SseHub } from "../../infrastructure/transport/sse";
import { Topic } from "./topic";

/**
 * BGM SSE 配信のイベント別ファサード
 * usecase 層は `SseHub` を直接触らずこの broadcaster の各メソッド経由で配信し、辞書にないキーや payload 不一致をシグネチャ単位でコンパイル時に弾く
 * `RoomId` から `BgmTopic` への変換も内部に閉じ込め、usecase からトピック組み立ての関心を取り除く
 */
@Injectable()
export class BgmBroadcaster {
  constructor(private readonly hub: SseHub) {}

  /**
   * BGM の現在状態が切り替わったことをルームの購読者全員に配信する
   * 楽曲の差し替え、停止、直前操作の取り消しのいずれも同じ `Changed` イベントで通知する
   */
  async changed(roomId: RoomId, data: BgmChanged): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "Changed", data);
  }
}
