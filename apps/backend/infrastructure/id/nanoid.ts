import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { CallId, InvitationId, MemberId, MurmurId, RoomId } from "@play.realtime/contracts";

/**
 * あらゆる ID の発行を 1 箇所に集めるサービス
 * ランダム性は node:crypto の `randomUUID` に任せて ID の種類ごとに型付けして返す
 * 名前に nanoid が残っているのは従来実装の履歴互換のためであり 振る舞いは UUIDv4 を土台としている
 */
@Injectable()
export class NanoidIdGenerator {
  /**
   * ルームの ID を発行する
   */
  room(): RoomId {
    return RoomId.parse(randomUUID().replace(/-/g, ""));
  }

  /**
   * メンバーの ID を発行する
   */
  member(): MemberId {
    return MemberId.parse(randomUUID().replace(/-/g, ""));
  }

  /**
   * ひとこと投稿の ID を発行する
   */
  murmur(): MurmurId {
    return MurmurId.parse(randomUUID().replace(/-/g, ""));
  }

  /**
   * 招待の ID を発行する
   */
  invitation(): InvitationId {
    return InvitationId.parse(randomUUID().replace(/-/g, ""));
  }

  /**
   * 通話の ID を発行する
   */
  call(): CallId {
    return CallId.parse(randomUUID().replace(/-/g, ""));
  }

  /**
   * SSE や WebSocket の接続単位を識別する型付けなしの ID を発行する
   */
  connection(): string {
    return randomUUID().replace(/-/g, "");
  }
}
