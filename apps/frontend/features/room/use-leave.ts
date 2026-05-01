"use client";

import { RoomEndpoint, type RoomId } from "@play.realtime/contracts";
import { useEffect } from "react";

import { origin } from "@/libraries/environment";

/**
 * `pagehide` イベントを購読し、`navigator.sendBeacon` で `POST /rooms/:roomId/leave` を投げる退出シグナル送出フック
 * iOS Safari でタブ swipe-away すると SSE と WebSocket の `close` イベントが発火しないため、サーバ側でメンバー幽霊化が起きる
 * `pagehide` は `beforeunload` よりも発火率が高く、`sendBeacon` は unload 時の送信完了を Page Lifecycle 仕様で保証するため、両者の組み合わせがモバイル退出検知の最有効手段になる
 * `roomId` が `null` のときは購読しないので、入室前の状態で空送信しない
 */
export const useLeave = (roomId: RoomId | null): void => {
  useEffect(() => {
    if (!roomId) {
      return;
    }

    const url = `${origin}${RoomEndpoint.leave(roomId)}`;

    const beacon = () => {
      navigator.sendBeacon(url);
    };

    window.addEventListener("pagehide", beacon);

    return () => {
      window.removeEventListener("pagehide", beacon);
    };
  }, [roomId]);
};
