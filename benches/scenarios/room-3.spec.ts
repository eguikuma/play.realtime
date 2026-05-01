import { test } from "@playwright/test";
import { runCycle } from "../helpers/cycle.js";

test("3 人室で代表的なサイクルを 1 周回す", async ({ browser }) => {
  await runCycle(browser, "room-3", 3);
});
