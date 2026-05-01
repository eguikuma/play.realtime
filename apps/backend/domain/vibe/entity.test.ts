import { describe, expect, it } from "vitest";
import { aggregate } from "./entity";

describe("aggregate", () => {
  it("`present` が 1 つでも含まれれば集約結果は `present` になる", () => {
    expect(aggregate(["focused", "present"])).toBe("present");
  });

  it("全て `focused` なら集約結果は `focused` になる", () => {
    expect(aggregate(["focused", "focused"])).toBe("focused");
  });

  it("ステータスが 1 つならその値をそのまま集約結果にする", () => {
    expect(aggregate(["present"])).toBe("present");
    expect(aggregate(["focused"])).toBe("focused");
  });
});
