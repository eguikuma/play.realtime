"use client";

import type { MemberId, RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";

import { useHallway } from "@/features/hallway/store";
import { useRoom } from "@/features/room/store";

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

/**
 * Vibe の行表示に必要なアバター配列を組み立てるフック
 * SSE 購読 / 可視状態送信 / Hallway の取り込み中判定 / 入室順並び替えをまとめて面倒見て、描画側は返り値をそのまま並べるだけにする
 * `onInvite` は招待不可条件を全て満たしたときだけ関数で返し、それ以外は `null` にして UI のボタン押下経路を型で塞ぐ
 */
export const useRow = (roomId: RoomId) => {
  const me = useRoom((state) => state.me);
  const members = useRoom((state) => state.room?.members ?? []);
  const statuses = useVibe((state) => state.statuses);
  const connectionId = useVibe((state) => state.connectionId);
  const invitations = useHallway((state) => state.invitations);
  const calls = useHallway((state) => state.calls);
  const send = useHallway((state) => state.send);

  useStream(me ? roomId : null);
  const change = useChange(roomId);
  useVisibility({ enabled: me !== null && connectionId !== null, onChange: change });

  const busy = useMemo(() => {
    const set = new Set<string>();
    for (const invitation of Object.values(invitations)) {
      set.add(invitation.fromMemberId);
      set.add(invitation.toMemberId);
    }
    for (const call of Object.values(calls)) {
      for (const id of call.memberIds) set.add(id);
    }
    return set;
  }, [invitations, calls]);

  const calling = useMemo(() => {
    const set = new Set<string>();
    for (const call of Object.values(calls)) {
      for (const id of call.memberIds) set.add(id);
    }
    return set;
  }, [calls]);

  const selfBusy = me !== null && busy.has(me.id);

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
        const isCalling = calling.has(memberId);
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
          !busy.has(memberId) &&
          me !== null &&
          send !== null;
        return {
          key: memberId as MemberId,
          name,
          state,
          disabled: !canInvite,
          onInvite:
            canInvite && send ? () => send("Invite", { inviteeId: memberId as MemberId }) : null,
        };
      });
  }, [statuses, members, me, calling, busy, selfBusy, send]);

  return {
    empty: avatars.length === 0,
    avatars,
  };
};
