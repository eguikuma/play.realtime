"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Call } from "../call";
import { Invitation } from "../invitation";
import { Outgoing } from "../outgoing";
import { useOverlays } from "./use-overlays";

/**
 * 廊下トークに関わる浮遊要素をまとめて配置する最上位部品
 * 受信中は右上 送信中は左下 通話は画面下部の 3 つの区画だけに絞って配置する
 */
export const HallwayOverlays = ({ roomId }: { roomId: RoomId }) => {
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
