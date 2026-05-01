import { Inject, Injectable } from "@nestjs/common";
import type { HallwaySnapshot, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";

/**
 * 廊下トーク購読開始時の `Snapshot` ペイロードを組み立てる usecase
 * 進行中の招待と通話を並列取得して束ねるだけで、フィルタや整形はクライアント側 UI に任せる
 */
@Injectable()
export class GetHallwaySnapshot {
  constructor(@Inject(HallwayRepository) private readonly hallway: HallwayRepository) {}

  async execute(input: { roomId: RoomId }): Promise<HallwaySnapshot> {
    const [invitations, calls] = await Promise.all([
      this.hallway.findAllInvitationsInRoom(input.roomId),
      this.hallway.findAllCallsInRoom(input.roomId),
    ]);
    return { invitations, calls };
  }
}
