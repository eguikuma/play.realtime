import type { ConnectionId } from "@play.realtime/contracts";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVisibility } from "./use-visibility";

const connectionId = "connection-test-1234" as ConnectionId;

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useVisibility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    setVisibility("visible");
    vi.useRealTimers();
  });

  it("`connectionId` が `null` なら `onChange` を呼ばない", () => {
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId: null, onChange }));

    act(() => {
      setVisibility("hidden");
      vi.advanceTimersByTime(8_000);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("マウント時に `visibility` が `visible` なら `notifyJoined` の `present` 登録に委ねて送信を抑止する", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId, onChange }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("マウント直後に `visible` のままタブが戻ってきても `lastSent` 同期済みで重複送信されない", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId, onChange }));

    act(() => {
      setVisibility("visible");
      vi.advanceTimersByTime(8_000);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("マウント時に `visibility` が `hidden` なら `focused` を `keepalive` で即時通知する", () => {
    setVisibility("hidden");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId, onChange }));

    expect(onChange).toHaveBeenCalledWith("focused", { keepalive: true });
  });

  it("`hidden` 遷移はデバウンスせず `keepalive` で即時 `focused` を通知し、`visible` 復帰はデバウンス越しに `present` を通知する", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId, onChange }));

    act(() => {
      setVisibility("hidden");
    });
    expect(onChange).toHaveBeenLastCalledWith("focused", { keepalive: true });
    onChange.mockClear();

    act(() => {
      setVisibility("visible");
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    expect(onChange).toHaveBeenLastCalledWith("present", undefined);
  });

  it("同じ `visibility` への遷移では重複通知しない", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId, onChange }));
    onChange.mockClear();

    act(() => {
      setVisibility("visible");
      setVisibility("visible");
      vi.advanceTimersByTime(8_000);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("アンマウント時に `visibilitychange` リスナーを解除する", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    const { unmount } = renderHook(() => useVisibility({ connectionId, onChange }));
    onChange.mockClear();

    unmount();

    act(() => {
      setVisibility("hidden");
      vi.advanceTimersByTime(8_000);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("`hidden` への遷移直後に `visible` へ戻ったときは `focused` 即時通知のあとデバウンスを保留タイマーごと破棄して `present` を再送しない", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId, onChange }));
    onChange.mockClear();

    act(() => {
      setVisibility("hidden");
    });
    expect(onChange).toHaveBeenLastCalledWith("focused", { keepalive: true });

    act(() => {
      vi.advanceTimersByTime(2_000);
      setVisibility("visible");
      vi.advanceTimersByTime(8_000);
    });

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith("present", undefined);
  });

  it("`visible` 復帰時のデバウンス窓経過後に最終状態だけを通知する", () => {
    setVisibility("hidden");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ connectionId, onChange }));
    onChange.mockClear();

    act(() => {
      setVisibility("visible");
      vi.advanceTimersByTime(7_999);
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith("present", undefined);
  });

  it("アンマウント時に保留中のデバウンスタイマーを破棄する", () => {
    setVisibility("hidden");
    const onChange = vi.fn();
    const { unmount } = renderHook(() => useVisibility({ connectionId, onChange }));
    onChange.mockClear();

    act(() => {
      setVisibility("visible");
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("`connectionId` が値から `null` に変わったとき保留中のデバウンスタイマーを破棄する", () => {
    setVisibility("hidden");
    const onChange = vi.fn();
    const { rerender } = renderHook(
      ({ connectionId: id }: { connectionId: ConnectionId | null }) =>
        useVisibility({ connectionId: id, onChange }),
      { initialProps: { connectionId: connectionId as ConnectionId | null } },
    );
    onChange.mockClear();

    act(() => {
      setVisibility("visible");
    });
    rerender({ connectionId: null });

    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("`connectionId` が変化したとき `lastSent` を再同期して新しい接続でも `hidden` 遷移で `focused` を再送する", () => {
    setVisibility("hidden");
    const onChange = vi.fn();
    const firstId = "connection-first-1234" as ConnectionId;
    const secondId = "connection-second-5678" as ConnectionId;
    const { rerender } = renderHook(
      ({ connectionId: id }: { connectionId: ConnectionId | null }) =>
        useVisibility({ connectionId: id, onChange }),
      { initialProps: { connectionId: firstId as ConnectionId | null } },
    );
    expect(onChange).toHaveBeenLastCalledWith("focused", { keepalive: true });

    onChange.mockClear();
    setVisibility("visible");
    rerender({ connectionId: secondId });

    act(() => {
      setVisibility("hidden");
    });

    expect(onChange).toHaveBeenLastCalledWith("focused", { keepalive: true });
  });
});
