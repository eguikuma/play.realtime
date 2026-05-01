import { Injectable } from "@nestjs/common";
import { BgmEvents, type BgmTopic } from "@play.realtime/contracts";
import type { z } from "zod";
import { SseHub } from "../../infrastructure/transport/sse";

/**
 * `BgmEvents` 辞書のキーに限定される配信イベント種別
 * `BgmBroadcaster.broadcast` の `name` 引数を型で束縛する
 */
type BgmEventName = Extract<keyof typeof BgmEvents, string>;

/**
 * BGM SSE 配信を `BgmEvents` 辞書で型束縛する薄いラッパ
 * usecase 層は `SseHub` を直接触らずこの broadcaster 経由で配信し、辞書にないキーや payload 不一致をコンパイル時に弾く
 */
@Injectable()
export class BgmBroadcaster {
  constructor(private readonly hub: SseHub) {}

  /**
   * 指定トピックへ BGM イベントを配信する、`name` は `BgmEvents` のキーに限定される
   */
  async broadcast<K extends BgmEventName>(
    topic: BgmTopic,
    name: K,
    data: z.infer<(typeof BgmEvents)[K]>,
    id?: string,
  ): Promise<void> {
    return this.hub.broadcast(topic, name, data, id);
  }
}
