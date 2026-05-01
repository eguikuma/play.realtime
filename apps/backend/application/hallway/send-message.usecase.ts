import { Inject, Injectable } from "@nestjs/common";
import type { CallId, CallMessage, MemberId, RoomId } from "@play.realtime/contracts";
import { CallNotFound, HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

@Injectable()
export class SendHallwayMessage {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  async execute(input: {
    roomId: RoomId;
    callId: CallId;
    memberId: MemberId;
    text: string;
  }): Promise<void> {
    const call = await this.hallway.findCall(input.callId);
    if (!call) {
      throw new CallNotFound(input.callId);
    }
    if (!call.memberIds.includes(input.memberId)) {
      throw new NotCallParticipant(input.callId, input.memberId);
    }

    const message: CallMessage = {
      callId: call.id,
      fromMemberId: input.memberId,
      text: input.text,
      sentAt: new Date().toISOString(),
    };

    await this.broadcaster.toMembers(input.roomId, call.memberIds, "Message", { message });
  }
}
