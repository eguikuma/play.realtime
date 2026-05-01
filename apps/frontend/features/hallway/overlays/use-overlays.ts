"use client";

import type { MemberId, RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";

import { useRoom } from "@/features/room/store";

import { useHallway } from "../store";
import { useActions } from "../use-actions";
import { useStream } from "../use-stream";

/**
 * ルーム画面で重ねて描画する廊下トーク UI (着信 / 発信中 / 通話中) に必要なデータを組み立てるフック
 * `me` が未入室の間は `null` を返して UI を一切描画しない、入室後のみ招待と通話を自分視点で分類する
 * 通話相手の名前は 2 人の `memberIds` から自分以外を選び、見つからないときは先頭メンバーへフォールバックする
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
