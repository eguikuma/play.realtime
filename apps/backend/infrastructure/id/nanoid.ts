import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { CallId, InvitationId, MemberId, MurmurId, RoomId } from "@play.realtime/contracts";

@Injectable()
export class NanoidIdGenerator {
  room(): RoomId {
    return RoomId.parse(randomUUID().replace(/-/g, ""));
  }

  member(): MemberId {
    return MemberId.parse(randomUUID().replace(/-/g, ""));
  }

  murmur(): MurmurId {
    return MurmurId.parse(randomUUID().replace(/-/g, ""));
  }

  invitation(): InvitationId {
    return InvitationId.parse(randomUUID().replace(/-/g, ""));
  }

  call(): CallId {
    return CallId.parse(randomUUID().replace(/-/g, ""));
  }

  connection(): string {
    return randomUUID().replace(/-/g, "");
  }
}
