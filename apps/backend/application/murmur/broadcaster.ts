import { Injectable } from "@nestjs/common";
import { MurmurEvents, type MurmurTopic } from "@play.realtime/contracts";
import type { z } from "zod";
import { SseHub } from "../../infrastructure/transport/sse";

/**
 * `MurmurEvents` 辞書のキーに限定される配信イベント種別
 * `MurmurBroadcaster.broadcast` の `name` 引数を型で束縛する
 */
type MurmurEventName = Extract<keyof typeof MurmurEvents, string>;

/**
 * ひとこと SSE 配信を `MurmurEvents` 辞書で型束縛する薄いラッパ
 * usecase 層は `SseHub` を直接触らずこの broadcaster 経由で配信し、辞書にないキーや payload 不一致をコンパイル時に弾く
 */
@Injectable()
export class MurmurBroadcaster {
  constructor(private readonly hub: SseHub) {}

  /**
   * 指定トピックへひとことイベントを配信する、`name` は `MurmurEvents` のキーに限定される
   */
  async broadcast<K extends MurmurEventName>(
    topic: MurmurTopic,
    name: K,
    data: z.infer<(typeof MurmurEvents)[K]>,
    id?: string,
  ): Promise<void> {
    return this.hub.broadcast(topic, name, data, id);
  }
}
