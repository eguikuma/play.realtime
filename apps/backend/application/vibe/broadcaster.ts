import { Injectable } from "@nestjs/common";
import { VibeEvents, type VibeTopic } from "@play.realtime/contracts";
import type { z } from "zod";
import { SseHub } from "../../infrastructure/transport/sse";

/**
 * `VibeEvents` 辞書のキーに限定される配信イベント種別
 * `VibeBroadcaster.broadcast` の `name` 引数を型で束縛する
 */
type VibeEventName = Extract<keyof typeof VibeEvents, string>;

/**
 * Vibe SSE 配信を `VibeEvents` 辞書で型束縛する薄いラッパ
 * usecase 層は `SseHub` を直接触らずこの broadcaster 経由で配信し、辞書にないキーや payload 不一致をコンパイル時に弾く
 */
@Injectable()
export class VibeBroadcaster {
  constructor(private readonly hub: SseHub) {}

  /**
   * 指定トピックへ Vibe イベントを配信する、`name` は `VibeEvents` のキーに限定される
   */
  async broadcast<K extends VibeEventName>(
    topic: VibeTopic,
    name: K,
    data: z.infer<(typeof VibeEvents)[K]>,
    id?: string,
  ): Promise<void> {
    return this.hub.broadcast(topic, name, data, id);
  }
}
