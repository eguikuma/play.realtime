import { Inject, Injectable } from "@nestjs/common";
import type { HallwaySnapshot, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";

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
