import type {
  Call,
  CallId,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";

/**
 * 廊下トーク永続化の port 型
 * 招待と通話の 2 種類の集約を扱い、メンバー単位 / ルーム単位の探索、発信側 / 着信側の区別など用途別にメソッドを分けている
 */
export type HallwayRepository = {
  /** 招待 1 件を新規作成または上書き保存する */
  saveInvitation: (invitation: Invitation) => Promise<void>;
  /** 指定 ID の招待を取得する、存在しなければ `null` を返す */
  findInvitation: (id: InvitationId) => Promise<Invitation | null>;
  /** 指定メンバーが発信した進行中の招待を取得する、取り込み中判定に使う */
  findOutgoingInvitation: (fromMemberId: MemberId) => Promise<Invitation | null>;
  /** 指定メンバーが受信した進行中の招待を取得する、取り込み中判定に使う */
  findIncomingInvitation: (toMemberId: MemberId) => Promise<Invitation | null>;
  /** 指定ルーム内の進行中の招待を全件返す、`Snapshot` 配信で使う */
  findAllInvitationsInRoom: (roomId: RoomId) => Promise<Invitation[]>;
  /** 指定 ID の招待を削除する、`Accept` / `Decline` / `Cancel` / `expired` のどのルートでも最終的に呼ばれる */
  deleteInvitation: (id: InvitationId) => Promise<void>;
  /** 通話 1 件を新規作成または上書き保存する */
  saveCall: (call: Call) => Promise<void>;
  /** 指定 ID の通話を取得する、存在しなければ `null` を返す */
  findCall: (id: CallId) => Promise<Call | null>;
  /** 指定メンバーが参加中の通話を取得する、取り込み中判定に使う */
  findCallForMember: (memberId: MemberId) => Promise<Call | null>;
  /** 指定ルーム内の進行中の通話を全件返す、`Snapshot` 配信で使う */
  findAllCallsInRoom: (roomId: RoomId) => Promise<Call[]>;
  /** 指定 ID の通話を削除する、`Leave` と `disconnect` のどちらのルートでも最終的に呼ばれる */
  deleteCall: (id: CallId) => Promise<void>;
  /** 指定ルームに属する全招待と全通話を削除する、ルーム閉鎖時のクリーンアップで使う */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * `HallwayRepository` 型と同名の DI トークン
 * NestJS の `@Inject(HallwayRepository)` で実装を注入するために、値空間にも同名の識別子を用意している
 */
export const HallwayRepository = "HallwayRepository" as const;
