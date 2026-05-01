import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVisibility } from "./use-visibility";

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useVisibility", () => {
  beforeEach(() => {
    setVisibility("visible");
  });

  afterEach(() => {
    setVisibility("visible");
  });

  it("`enabled` が `false` なら `onChange` を呼ばない", () => {
    const onChange = vi.fn();
    renderHook(() => useVisibility({ enabled: false, onChange }));

    act(() => {
      setVisibility("hidden");
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("マウント時に `visibility` が `visible` なら `present` を通知する", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ enabled: true, onChange }));

    expect(onChange).toHaveBeenCalledWith("present");
  });

  it("マウント時に `visibility` が `hidden` なら `focused` を通知する", () => {
    setVisibility("hidden");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ enabled: true, onChange }));

    expect(onChange).toHaveBeenCalledWith("focused");
  });

  it("`visibility` の変化で `present` と `focused` を切り替える", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ enabled: true, onChange }));

    act(() => {
      setVisibility("hidden");
    });
    expect(onChange).toHaveBeenLastCalledWith("focused");

    act(() => {
      setVisibility("visible");
    });
    expect(onChange).toHaveBeenLastCalledWith("present");
  });

  it("同じ `visibility` への遷移では重複通知しない", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    renderHook(() => useVisibility({ enabled: true, onChange }));
    onChange.mockClear();

    act(() => {
      setVisibility("visible");
      setVisibility("visible");
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("アンマウント時に `visibilitychange` リスナーを解除する", () => {
    setVisibility("visible");
    const onChange = vi.fn();
    const { unmount } = renderHook(() => useVisibility({ enabled: true, onChange }));
    onChange.mockClear();

    unmount();

    act(() => {
      setVisibility("hidden");
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
