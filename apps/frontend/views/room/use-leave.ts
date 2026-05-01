"use client";

import { RoomEndpoint, type RoomId } from "@play.realtime/contracts";
import { useEffect } from "react";
import { origin } from "@/libraries/environment";

/**
 * 同メンバーの別タブ生存判定に使うハートビートの間隔
 */
const HEARTBEAT_INTERVAL_MS = 1000;

/**
 * ハートビートが古いタブを「生存していない」と判定するしきい値
 * `HEARTBEAT_INTERVAL_MS` を 3 倍取り、ブラウザのバックグラウンドタブ throttling 1Hz を踏んでも見逃さない余裕を持たせる
 */
const STALE_THRESHOLD_MS = 3000;

const STORAGE_KEY_PREFIX = "rimodoki:tab:";

const storageKeyOf = (roomId: RoomId, tabId: string): string =>
  `${STORAGE_KEY_PREFIX}${roomId}:${tabId}`;

const storagePrefixOf = (roomId: RoomId): string => `${STORAGE_KEY_PREFIX}${roomId}:`;

/**
 * 同 `roomId` の別タブがハートビート閾値内に生存しているかを判定する
 * 自タブ以外で `STALE_THRESHOLD_MS` 内のタイムスタンプが残っているキーが 1 つでもあれば true を返す
 */
const otherTabsAlive = (roomId: RoomId, ownTabId: string): boolean => {
  const prefix = storagePrefixOf(roomId);
  const ownKey = storageKeyOf(roomId, ownTabId);
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix) || key === ownKey) {
      continue;
    }
    const ts = Number(localStorage.getItem(key) ?? "0");
    if (now - ts < STALE_THRESHOLD_MS) {
      return true;
    }
  }
  return false;
};

/**
 * `pagehide` イベントを購読し、最終タブのときだけ `navigator.sendBeacon` で `POST /rooms/:roomId/leave` を投げる退出シグナル送出フック
 * iOS Safari のタブ swipe-away では SSE と WebSocket の `close` イベントが発火せずサーバ側でメンバー幽霊化が起きる
 * 一方で Chrome 等で同メンバーの別タブが残っているときに beacon を投げると、サーバの `MemberLeft` 配信が他タブの接続まで強制クローズしてフリッカーになる
 * そこで localStorage 上のハートビートで「自タブ以外に生存中の同メンバータブがあるか」を判定し、最終タブのときだけ beacon を投げて両ケースを両立させる
 * `roomId` が `null` のときは購読しないので、入室前の状態で空送信しない
 */
export const useLeave = (roomId: RoomId | null): void => {
  useEffect(() => {
    if (!roomId) {
      return;
    }

    const tabId = crypto.randomUUID();
    const ownStorageKey = storageKeyOf(roomId, tabId);
    const url = `${origin}${RoomEndpoint.leave(roomId)}`;

    const heartbeat = (): void => {
      try {
        localStorage.setItem(ownStorageKey, String(Date.now()));
      } catch {
        /** localStorage が使えない (private browsing 容量超過等) ときは判定を諦める、後段の beacon 側で fallback する */
      }
    };

    heartbeat();
    const interval = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

    const beacon = (): void => {
      try {
        localStorage.removeItem(ownStorageKey);
      } catch {
        /** localStorage が使えないなら最終タブ判定が成立しないため、iOS swipe-away の幽霊化を防ぐ側に倒して beacon を投げる */
        navigator.sendBeacon(url);
        return;
      }

      if (otherTabsAlive(roomId, tabId)) {
        return;
      }
      navigator.sendBeacon(url);
    };

    window.addEventListener("pagehide", beacon);

    return () => {
      window.removeEventListener("pagehide", beacon);
      window.clearInterval(interval);
      try {
        localStorage.removeItem(ownStorageKey);
      } catch {
        /** unmount 経路はベストエフォートでよい、自タブの heartbeat が止まれば他タブから自然に stale 判定される */
      }
    };
  }, [roomId]);
};
