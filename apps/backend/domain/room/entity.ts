import type { Member, MemberId, Room, RoomId } from "@play.realtime/contracts";

/**
 * 新しいルームをホスト 1 人の状態で作成する
 * `hostMemberId` はホスト自身の ID で、`members` も最初はホスト 1 人だけの配列になる
 */
export const create = (parameters: { id: RoomId; host: Member; createdAt: string }): Room => ({
  id: parameters.id,
  hostMemberId: parameters.host.id,
  members: [parameters.host],
  createdAt: parameters.createdAt,
});

/**
 * 既存ルームに新しいメンバーを追加した新しい `Room` を返す純粋関数
 * 同一 ID のメンバーが既に入室している場合は入力をそのまま返し、再参加でメンバー配列が膨らまないようにする
 */
export const join = (room: Room, member: Member): Room => {
  if (room.members.some((existing) => existing.id === member.id)) {
    return room;
  }
  return { ...room, members: [...room.members, member] };
};

/**
 * ルームから指定メンバーを除いた新しい `Room` を返す純粋関数
 * 元のルームを書き換えず、呼び出し元は戻り値を永続化する前提で使う
 */
export const leave = (room: Room, memberId: MemberId): Room => ({
  ...room,
  members: room.members.filter((each) => each.id !== memberId),
});
