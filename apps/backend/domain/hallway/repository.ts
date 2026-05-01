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
  /**
   * 招待 1 件を保存するか 同じ ID の内容で上書き保存する
   */
  saveInvitation: (invitation: Invitation) => Promise<void>;
  /**
   * 招待を ID 直接引きで返し 未登録ならなしを返す
   */
  findInvitation: (id: InvitationId) => Promise<Invitation | null>;
  /**
   * 指定メンバーが発信した未応答の招待を返し 無ければなしを返す
   */
  findOutgoingInvitation: (fromMemberId: MemberId) => Promise<Invitation | null>;
  /**
   * 指定メンバー宛の未応答の招待を返し 無ければなしを返す
   */
  findIncomingInvitation: (toMemberId: MemberId) => Promise<Invitation | null>;
  /**
   * ルーム内の全招待を返す
   */
  findAllInvitationsInRoom: (roomId: RoomId) => Promise<Invitation[]>;
  /**
   * 指定 ID の招待 1 件を取り除く
   * 既に存在しない場合も冪等に無視する
   */
  deleteInvitation: (id: InvitationId) => Promise<void>;
  /**
   * 通話 1 件を保存するか 同じ ID の内容で上書き保存する
   */
  saveCall: (call: Call) => Promise<void>;
  /**
   * 通話を ID 直接引きで返し 未登録ならなしを返す
   */
  findCall: (id: CallId) => Promise<Call | null>;
  /**
   * 指定メンバーが参加中の通話を返し 無ければなしを返す
   */
  findCallForMember: (memberId: MemberId) => Promise<Call | null>;
  /**
   * ルーム内の全通話を返す
   */
  findAllCallsInRoom: (roomId: RoomId) => Promise<Call[]>;
  /**
   * 指定 ID の通話 1 件を取り除く
   * 既に存在しない場合も冪等に無視する
   */
  deleteCall: (id: CallId) => Promise<void>;
  /**
   * 指定ルームに紐づく招待と通話を全て台帳から取り除く
   * 逆引き索引も合わせて後片付けする
   * 既に存在しない場合も冪等に無視する
   */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const HallwayRepository = "HallwayRepository" as const;
