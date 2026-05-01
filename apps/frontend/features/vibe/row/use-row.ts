"use client";

import type { MemberId, RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";
import { useSession } from "@/stores/session";
import type { AvatarState } from "../avatar";
import { useVibe } from "../store";
import { useChange } from "../use-change";
import { useStream } from "../use-stream";
import { useVisibility } from "../use-visibility";

type Avatar = {
  key: MemberId;
  name: string;
  state: AvatarState;
  disabled: boolean;
  onInvite: (() => void) | null;
};

type Row = {
  /** 表示対象のルーム ID、SSE 購読と可視状態送信の宛先に使う */
  roomId: RoomId;
  /** 招待や通話で取り込み中のメンバー ID 集合、`Hallway` の状態から composition feature が組み立てて注入する */
  busyMemberIds: Set<MemberId>;
  /** 通話中のメンバー ID 集合、avatar の `calling` 状態判定に使う */
  callingMemberIds: Set<MemberId>;
  /** 招待コマンドの送信経路、`null` のときは送信不能としてボタンを出さない */
  invite: ((memberId: MemberId) => void) | null;
};

/**
 * Vibe の行表示に必要なアバター配列を組み立てるフック
 * SSE 購読、可視状態送信、入室順並び替えを面倒見て、描画側は返り値をそのまま並べるだけにする
 * Hallway の取り込み中判定と招待送信は composition feature 側で算出して props で受け取り、Vibe からは Hallway store を直接参照しない
 * `onInvite` は招待不可条件を全て満たしたときだけ関数で返し、それ以外は `null` にして UI のボタン押下経路を型で塞ぐ
 */
export const useRow = ({ roomId, busyMemberIds, callingMemberIds, invite }: Row) => {
  const me = useSession((state) => state.me);
  const members = useSession((state) => state.room?.members ?? []);
  const statuses = useVibe((state) => state.statuses);
  const connectionId = useVibe((state) => state.connectionId);

  useStream(me ? roomId : null);
  const change = useChange(roomId);
  useVisibility({ enabled: me !== null && connectionId !== null, onChange: change });

  const selfBusy = me !== null && busyMemberIds.has(me.id);

  const avatars = useMemo<Avatar[]>(() => {
    const joinedAtOf = new Map(members.map((member) => [member.id, member.joinedAt]));
    return Object.entries(statuses)
      .sort(([a], [b]) => {
        const aAt = joinedAtOf.get(a as MemberId) ?? "";
        const bAt = joinedAtOf.get(b as MemberId) ?? "";
        if (aAt !== bAt) return aAt.localeCompare(bAt);
        return a.localeCompare(b);
      })
      .map(([memberId, status]) => {
        const member = members.find((entry) => entry.id === memberId);
        const name = member?.name ?? "unknown";
        const isSelf = me?.id === memberId;
        const isCalling = callingMemberIds.has(memberId as MemberId);
        const state: AvatarState = isSelf
          ? "self"
          : isCalling
            ? "calling"
            : status === "focused"
              ? "focused"
              : "present";
        const canInvite =
          !isSelf &&
          !selfBusy &&
          !isCalling &&
          status === "present" &&
          !busyMemberIds.has(memberId as MemberId) &&
          me !== null &&
          invite !== null;
        return {
          key: memberId as MemberId,
          name,
          state,
          disabled: !canInvite,
          onInvite: canInvite && invite ? () => invite(memberId as MemberId) : null,
        };
      });
  }, [statuses, members, me, callingMemberIds, busyMemberIds, selfBusy, invite]);

  return {
    empty: avatars.length === 0,
    avatars,
  };
};
