import { Injectable } from "@nestjs/common";
import type { RoomId, VibeJoined, VibeLeft, VibeUpdated } from "@play.realtime/contracts";
import { SseHub } from "../../infrastructure/transport/sse";
import { Topic } from "./topic";

/**
 * Vibe SSE 配信のイベント別ファサード
 * usecase 層は `SseHub` を直接触らずこの broadcaster の各メソッド経由で配信し、辞書にないキーや payload 不一致をシグネチャ単位でコンパイル時に弾く
 * `RoomId` から `VibeTopic` への変換も内部に閉じ込め、usecase からトピック組み立ての関心を取り除く
 */
@Injectable()
export class VibeBroadcaster {
  constructor(private readonly hub: SseHub) {}

  /**
   * 新規メンバー入室を Vibe トピック購読者全員に配信する
   */
  async joined(roomId: RoomId, data: VibeJoined): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "Joined", data);
  }

  /**
   * メンバー退室を Vibe トピック購読者全員に配信する
   */
  async left(roomId: RoomId, data: VibeLeft): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "Left", data);
  }

  /**
   * 既存メンバーの状態変化を Vibe トピック購読者全員に配信する
   */
  async updated(roomId: RoomId, data: VibeUpdated): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "Updated", data);
  }
}
