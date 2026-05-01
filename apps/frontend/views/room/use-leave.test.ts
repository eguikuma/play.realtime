import type { RoomId } from "@play.realtime/contracts";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@play.realtime/contracts", () => ({
  RoomEndpoint: {
    leave: (id: string) => `/rooms/${id}/leave`,
  },
}));

import { useLeave } from "./use-leave";

const roomId = "room-abc-1234" as RoomId;

const otherTabKey = (suffix: string): string => `rimodoki:tab:${roomId}:${suffix}`;

const dispatchPagehide = (persisted: boolean): void => {
  const event = new Event("pagehide") as Event & { persisted: boolean };
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
};

describe("useLeave", () => {
  let sendBeacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-30T00:00:00Z"));
    localStorage.clear();
    sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("`pagehide` で `/rooms/:roomId/leave` に `sendBeacon` を投げる", () => {
    renderHook(() => useLeave(roomId));

    act(() => {
      dispatchPagehide(false);
    });

    expect(sendBeacon).toHaveBeenCalledOnce();
    const url = sendBeacon.mock.calls[0]?.[0] as string;
    expect(url.endsWith(`/rooms/${roomId}/leave`)).toBe(true);
  });

  it("`pagehide` の `persisted` が `true` の BFCache 経路では `sendBeacon` を呼ばない", () => {
    renderHook(() => useLeave(roomId));

    act(() => {
      dispatchPagehide(true);
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("`roomId` が `null` のときは `pagehide` でも `sendBeacon` を呼ばない", () => {
    renderHook(() => useLeave(null));

    act(() => {
      dispatchPagehide(false);
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("アンマウント後の `pagehide` では `sendBeacon` を呼ばない", () => {
    const { unmount } = renderHook(() => useLeave(roomId));

    unmount();
    act(() => {
      dispatchPagehide(false);
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("同じルームの別タブのハートビートが新しいときは `sendBeacon` を呼ばない", () => {
    localStorage.setItem(otherTabKey("other"), String(Date.now()));

    renderHook(() => useLeave(roomId));

    act(() => {
      dispatchPagehide(false);
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("別タブのハートビートが古いときは `sendBeacon` を呼ぶ", () => {
    localStorage.setItem(otherTabKey("dead"), String(Date.now() - 5000));

    renderHook(() => useLeave(roomId));

    act(() => {
      dispatchPagehide(false);
    });

    expect(sendBeacon).toHaveBeenCalledOnce();
  });

  it("別ルームのタブが生存中でも自ルームの最終タブなら `sendBeacon` を呼ぶ", () => {
    localStorage.setItem(`rimodoki:tab:other-room:foo`, String(Date.now()));

    renderHook(() => useLeave(roomId));

    act(() => {
      dispatchPagehide(false);
    });

    expect(sendBeacon).toHaveBeenCalledOnce();
  });

  it("マウント時に自タブのハートビートを localStorage に書く", () => {
    renderHook(() => useLeave(roomId));

    let foundOwnHeartbeat = false;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(`rimodoki:tab:${roomId}:`)) {
        foundOwnHeartbeat = true;
        break;
      }
    }
    expect(foundOwnHeartbeat).toBe(true);
  });

  it("アンマウント時に自タブのハートビートを localStorage から消す", () => {
    const { unmount } = renderHook(() => useLeave(roomId));

    let beforeUnmountHasOwn = false;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(`rimodoki:tab:${roomId}:`)) {
        beforeUnmountHasOwn = true;
        break;
      }
    }
    expect(beforeUnmountHasOwn).toBe(true);

    unmount();

    let afterUnmountHasOwn = false;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(`rimodoki:tab:${roomId}:`)) {
        afterUnmountHasOwn = true;
        break;
      }
    }
    expect(afterUnmountHasOwn).toBe(false);
  });
});
