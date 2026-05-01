import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { CallId, InvitationId, MemberId, MurmurId, RoomId } from "@play.realtime/contracts";

/**
 * ドメインのブランド型 ID を採番するユーティリティ
 * Node 標準の `randomUUID` をハイフン除去で詰めた文字列を使い、Zod の brand 経由で型を付ける
 * 実装名に `Nanoid` が残るのは歴史的経緯で、現状は UUID v4 ベース
 */
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

  /**
   * ブランド型ではなく素の `string` を返す接続 ID、SSE / WebSocket 接続単位の識別子として使う
   */
  connection(): string {
    return randomUUID().replace(/-/g, "");
  }
}
