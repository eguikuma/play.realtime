import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, Member, RoomId } from "@play.realtime/contracts";
import { VibeRepository } from "../../domain/vibe";
import { VibeBroadcaster } from "./broadcaster";
import { VibePresenceGrace } from "./presence-grace";

/**
 * Vibe SSE 接続確立時に呼ばれ、メンバーの入室を接続単位で記録してから他メンバーへ通知する usecase
 * 猶予タイマーが張られている最中の再入室なら `Joined` ではなく `Updated` を配信し、画面の点滅を防ぐ
 */
@Injectable()
export class NotifyVibeJoined {
  constructor(
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly broadcaster: VibeBroadcaster,
    @Inject(VibePresenceGrace) private readonly grace: VibePresenceGrace,
  ) {}

  /**
   * 接続を `present` で登録し、猶予タイマーを取り消す
   * そのメンバー初の接続かつ猶予タイマーが張られていなかった場合のみ `Joined` を配信する
   * 猶予タイマーを取り消せた再入室ケースでは `Updated` に切り替えて他メンバーの画面が点滅しないようにする
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
      await this.broadcaster.joined(input.roomId, {
        member: input.member,
        status: aggregated,
      });
      return;
    }

    await this.broadcaster.updated(input.roomId, {
      memberId: input.member.id,
      status: aggregated,
    });
  }
}
