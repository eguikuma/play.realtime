import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, Member, RoomId } from "@play.realtime/contracts";
import { VibeRepository } from "../../domain/vibe";
import { SseHub } from "../../infrastructure/transport/sse";
import { VibePresenceGrace } from "./presence-grace";
import { topic } from "./topic";

/**
 * 新規接続が発生したときに `Joined` または `Update` を配信するユースケース
 * 本当の初入室のみを `Joined` とし 直前の猶予期間中であれば再入室とみなして `Update` に振り替える
 */
@Injectable()
export class NotifyVibeJoined {
  /**
   * 空気のポートと SSE ハブ そして在室猶予サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly hub: SseHub,
    private readonly grace: VibePresenceGrace,
  ) {}

  /**
   * 接続保存 猶予の取り消し判定 そして初入室なら `Joined` そうでなければ `Update` を配信する
   * リロードやタブ切り替えの瞬断を `Joined` の点滅として見せない振る舞いを実現する
   */
  async execute(input: {
    roomId: RoomId;
    member: Member;
    connectionId: ConnectionId;
  }): Promise<void> {
    const { isFirst, aggregated } = await this.vibes.save(
      input.roomId,
      input.member.id,
      input.connectionId,
      "present",
    );
    const rejoined = this.grace.cancel(input.roomId, input.member.id);
    if (isFirst && !rejoined) {
      await this.hub.broadcast(topic(input.roomId), "Joined", {
        member: input.member,
        status: aggregated,
      });
      return;
    }
    await this.hub.broadcast(topic(input.roomId), "Update", {
      memberId: input.member.id,
      status: aggregated,
    });
  }
}
