import { Inject, Injectable } from "@nestjs/common";
import type { CallId, MemberId, RoomId } from "@play.realtime/contracts";
import { CallNotFound, HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

@Injectable()
export class LeaveHallwayCall {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  async execute(input: { roomId: RoomId; callId: CallId; memberId: MemberId }): Promise<void> {
    const call = await this.hallway.findCall(input.callId);
    if (!call) {
      throw new CallNotFound(input.callId);
    }
    if (!call.memberIds.includes(input.memberId)) {
      throw new NotCallParticipant(input.callId, input.memberId);
    }

    await this.hallway.deleteCall(input.callId);

    await this.broadcaster.toRoom(input.roomId, "CallEnded", {
      callId: input.callId,
      reason: "explicit" as const,
    });
  }
}
