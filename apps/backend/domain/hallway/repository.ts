import type {
  Call,
  CallId,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";

/**
 * 招待と通話の永続化ポートを表す
 * 招待 1 件や通話 1 件を単位とする操作と ルームやメンバーを起点にした検索を担う
 * ドメイン語彙は持ち込まず 素の入出力のみを露出する
 */
export type HallwayRepository = {
  saveInvitation: (invitation: Invitation) => Promise<void>;
  findInvitation: (id: InvitationId) => Promise<Invitation | null>;
  findOutgoingInvitation: (fromMemberId: MemberId) => Promise<Invitation | null>;
  findIncomingInvitation: (toMemberId: MemberId) => Promise<Invitation | null>;
  findAllInvitationsInRoom: (roomId: RoomId) => Promise<Invitation[]>;
  deleteInvitation: (id: InvitationId) => Promise<void>;
  saveCall: (call: Call) => Promise<void>;
  findCall: (id: CallId) => Promise<Call | null>;
  findCallForMember: (memberId: MemberId) => Promise<Call | null>;
  findAllCallsInRoom: (roomId: RoomId) => Promise<Call[]>;
  deleteCall: (id: CallId) => Promise<void>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const HallwayRepository = "HallwayRepository" as const;
