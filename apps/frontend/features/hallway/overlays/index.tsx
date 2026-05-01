"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Call } from "../call";
import { Invitation } from "../invitation";
import { Outgoing } from "../outgoing";
import { useOverlays } from "./use-overlays";

type HallwayOverlays = {
  /** オーバーレイを表示する対象のルーム ID、WebSocket 購読と招待 / 通話の API 送信先に使う */
  roomId: RoomId;
};

/**
 * ルーム画面に重ねて表示する廊下トーク関連のオーバーレイ群
 * 右上に受信中の招待、左下に自分が出している呼び出し、下端に通話中の窓を配置する
 * フック側が未入室のときに null を返すのに合わせて、ここでも早期 return で何も描かない
 */
export const HallwayOverlays = ({ roomId }: HallwayOverlays) => {
  const overlays = useOverlays(roomId);

  if (!overlays) return null;

  return (
    <>
      {overlays.incoming.length > 0 && (
        <div className="pointer-events-none fixed top-24 right-6 z-40 flex flex-col gap-3 md:right-10">
          {overlays.incoming.map((invitation) => (
            <Invitation
              key={invitation.id}
              fromName={invitation.fromName}
              expiresAt={invitation.expiresAt}
              onAccept={invitation.onAccept}
              onDecline={invitation.onDecline}
            />
          ))}
        </div>
      )}

      {overlays.outgoing.length > 0 && (
        <div className="pointer-events-none fixed bottom-6 left-6 z-40 flex flex-col gap-2 md:left-10">
          {overlays.outgoing.map((invitation) => (
            <Outgoing
              key={invitation.id}
              toName={invitation.toName}
              onCancel={invitation.onCancel}
            />
          ))}
        </div>
      )}

      {overlays.call && (
        <div className="pointer-events-none fixed inset-x-4 bottom-6 z-50 md:inset-x-0">
          <Call
            key={overlays.call.id}
            callId={overlays.call.id}
            peerName={overlays.call.peerName}
          />
        </div>
      )}
    </>
  );
};
