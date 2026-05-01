import { describe, expect, it } from "vitest";
import { aggregate } from "./entity";

describe("aggregate", () => {
  it("present が 1 つでも含まれれば present を返す", () => {
    expect(aggregate(["focused", "present"])).toBe("present");
  });

  it("全て focused なら focused を返す", () => {
    expect(aggregate(["focused", "focused"])).toBe("focused");
  });

  it("要素が 1 つならその値をそのまま返す", () => {
    expect(aggregate(["present"])).toBe("present");
    expect(aggregate(["focused"])).toBe("focused");
  });
});
