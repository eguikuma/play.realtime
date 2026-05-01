import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId, VibeStatus } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";
import { VibeBroadcaster } from "./broadcaster";

/**
 * クライアントからのタブ可視状態変化を受けて接続単位の Vibe を更新し、集約結果が変わった場合だけ `Updated` を配信する usecase
 * 同一メンバーの複数接続で他タブが `present` を保っている場合など、集約後の値が変わらないケースでは配信を抑制する
 */
@Injectable()
export class ChangeVibeStatus {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly broadcaster: VibeBroadcaster,
  ) {}

  /**
   * ルーム存在確認、接続単位の状態更新、集約結果の差分チェック、SSE 配信の順で流れる
   * `updated` が `false`、または `aggregated` が `null` のときは配信しない
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    connectionId: ConnectionId;
    status: VibeStatus;
  }): Promise<void> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const { updated, aggregated } = await this.vibes.update(
      input.roomId,
      input.memberId,
      input.connectionId,
      input.status,
    );
    if (!updated || aggregated === null) {
      return;
    }
    await this.broadcaster.updated(input.roomId, {
      memberId: input.memberId,
      status: aggregated,
    });
  }
}
