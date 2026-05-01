"use client";

import type { MemberId, RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";

import { useRoom } from "@/features/room/store";

import { useHallway } from "../store";
import { useActions } from "../use-actions";
import { useStream } from "../use-stream";

/**
 * 浮遊要素の最上位部品のビューモデルを組み立てるフック
 * 自分自身を軸に 受信中 送信中 通話の 3 種類の表示データを絞り込む
 * 自分自身が未解決のあいだはなしを返し 浮遊要素の描画自体を抑える
 */
export const useOverlays = (roomId: RoomId) => {
  const me = useRoom((state) => state.me);
  const members = useRoom((state) => state.room?.members ?? []);
  const invitations = useHallway((state) => state.invitations);
  const calls = useHallway((state) => state.calls);
  const actions = useActions();

  useStream(me ? roomId : null);

  const nameOf = useMemo(
    () => (id: MemberId) => members.find((member) => member.id === id)?.name ?? "unknown",
    [members],
  );

  if (!me) {
    return null;
  }

  const mine = Object.values(invitations);
  const activeCall = Object.values(calls).find((call) => call.memberIds.includes(me.id));

  const incoming = mine
    .filter((invitation) => invitation.toMemberId === me.id)
    .map((invitation) => ({
      id: invitation.id,
      fromName: nameOf(invitation.fromMemberId),
      expiresAt: invitation.expiresAt,
      onAccept: () => actions.accept(invitation.id),
      onDecline: () => actions.decline(invitation.id),
    }));

  const outgoing = mine
    .filter((invitation) => invitation.fromMemberId === me.id)
    .map((invitation) => ({
      id: invitation.id,
      toName: nameOf(invitation.toMemberId),
      onCancel: () => actions.cancel(invitation.id),
    }));

  const call = activeCall
    ? {
        id: activeCall.id,
        peerName: nameOf(
          activeCall.memberIds.find((id) => id !== me.id) ?? activeCall.memberIds[0],
        ),
      }
    : null;

  return { incoming, outgoing, call };
};
