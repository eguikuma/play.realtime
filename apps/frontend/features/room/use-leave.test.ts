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

describe("useLeave", () => {
  let sendBeacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("`pagehide` で `/rooms/:roomId/leave` に `sendBeacon` を投げる", () => {
    renderHook(() => useLeave(roomId));

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(sendBeacon).toHaveBeenCalledOnce();
    const url = sendBeacon.mock.calls[0]?.[0] as string;
    expect(url.endsWith(`/rooms/${roomId}/leave`)).toBe(true);
  });

  it("`roomId` が `null` のときは `pagehide` でも `sendBeacon` を呼ばない", () => {
    renderHook(() => useLeave(null));

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("アンマウント後の `pagehide` では `sendBeacon` を呼ばない", () => {
    const { unmount } = renderHook(() => useLeave(roomId));

    unmount();
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
