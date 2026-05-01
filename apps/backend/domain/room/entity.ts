import type { Member, MemberId, Room, RoomId } from "@play.realtime/contracts";

/**
 * ホストを最初のメンバーとして新規ルームを組み立てる
 * ID と作成時刻はサーバーが生成した値を渡す前提とし ドメインは組み立てのみを担う
 */
export const create = (parameters: { id: RoomId; host: Member; createdAt: string }): Room => ({
  id: parameters.id,
  hostMemberId: parameters.host.id,
  members: [parameters.host],
  createdAt: parameters.createdAt,
});

/**
 * 新しいメンバーを参加メンバー一覧に追加する
 * 既存メンバーと同じ ID の場合は既存情報を優先し 重複追加は起こさない
 */
export const join = (room: Room, member: Member): Room => {
  if (room.members.some((existing) => existing.id === member.id)) {
    return room;
  }
  return { ...room, members: [...room.members, member] };
};

/**
 * 指定したメンバー ID を参加メンバー一覧から外す
 * 対象が存在しない場合は参加メンバー一覧をそのまま返す
 */
export const leave = (room: Room, memberId: MemberId): Room => ({
  ...room,
  members: room.members.filter((each) => each.id !== memberId),
});
