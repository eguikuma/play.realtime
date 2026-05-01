import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type SseClient, SseState } from "./port";
import { useSse } from "./use-connection";

const buildClient = (close: () => void = vi.fn()): SseClient => ({
  connect: vi.fn(() => ({ close })),
});

describe("useSse", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("url が null なら client.connect を呼ばない", () => {
    const client = buildClient();
    renderHook(() =>
      useSse({
        client,
        url: null,
        events: {},
        onEvent: vi.fn(),
      }),
    );

    expect(client.connect).not.toHaveBeenCalled();
  });

  it("url が与えられると client.connect を呼ぶ", () => {
    const client = buildClient();
    const { result } = renderHook(() =>
      useSse({
        client,
        url: "http://api.test/stream",
        events: {},
        onEvent: vi.fn(),
      }),
    );

    expect(client.connect).toHaveBeenCalledOnce();
    expect(result.current.state).toBe(SseState.Closed);
  });

  it("url 変更時は前の接続を閉じて再接続する", () => {
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    let calls = 0;
    const client: SseClient = {
      connect: vi.fn(() => {
        calls += 1;
        return { close: calls === 1 ? firstClose : secondClose };
      }),
    };
    const { rerender } = renderHook(
      ({ url }: { url: string }) =>
        useSse({
          client,
          url,
          events: {},
          onEvent: vi.fn(),
        }),
      { initialProps: { url: "http://api.test/a" } },
    );

    rerender({ url: "http://api.test/b" });

    expect(client.connect).toHaveBeenCalledTimes(2);
    expect(firstClose).toHaveBeenCalledOnce();
  });

  it("unmount 時に接続を閉じる", () => {
    const close = vi.fn();
    const client = buildClient(close);
    const { unmount } = renderHook(() =>
      useSse({
        client,
        url: "http://api.test/stream",
        events: {},
        onEvent: vi.fn(),
      }),
    );

    unmount();

    expect(close).toHaveBeenCalledOnce();
  });
});
