import { test } from "@playwright/test";
import { runCycle } from "../helpers/cycle.js";

test("10 人室で代表的なサイクルを 1 周回す", async ({ browser }) => {
  await runCycle(browser, "room-10", 10);
});
