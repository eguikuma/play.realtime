import type { Member, Room, RoomId } from "@play.realtime/contracts";

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
 *
 * `Room.members` は入場名簿として時間的に単調増加する集合で、一度載ったメンバーが配列から消えることはない
 * 離席や再入室の実態は Vibe aggregate が connection 単位で別途管理しており、Room からメンバーを削除する経路は持たない
 */
export const join = (room: Room, member: Member): Room => {
  if (room.members.some((existing) => existing.id === member.id)) {
    return room;
  }
  return { ...room, members: [...room.members, member] };
};
