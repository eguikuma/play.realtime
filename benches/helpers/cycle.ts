import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Browser, BrowserContext } from "@playwright/test";
import { Bot } from "../bots/bot.js";
import { totalScheduleMs, type VisibilityWindow } from "./clock.js";
import { type CommandTally, RedisMonitor } from "./monitor.js";

/**
 * 1 サイクル分の調整つまみ
 * `visibilitySchedule` は各メンバーの集中・離席パターンを区間配列で表す
 * bot ごとに開始位相をずらして使う
 * `murmurRounds` は全メンバーが順に投稿する周回数、`hallwayMessageRounds` は通話中の往復回数
 * `bgmRounds` はホスト 1 人が選曲と停止と取り消しを 1 セットで回す周回数、0 のときは BGM サイクルを実行しない
 * `graceMs` は退室後に room close grace の経過を待つ余白、ライフサイクル後始末の Redis コマンドまで MONITOR で拾う目的
 */
export type CycleKnobs = {
  visibilitySchedule: VisibilityWindow[];
  murmurRounds: number;
  hallwayMessageRounds: number;
  bgmRounds: number;
  graceMs: number;
};

export type CycleSnapshot = {
  scenario: string;
  memberCount: number;
  knobs: CycleKnobs;
  tally: CommandTally;
};

/**
 * 既定の visibility schedule、合計 90s 1 周
 * debounce window 想定 5〜10s に対して短い hidden (2s / 4s) で吸収を、長い hidden (6s / 12s) で確実な拾い上げを 1 周に同居させる
 * Phase B の A/B 評価が「同値抑止だけで何 % 削減」と「debounce で何 % 削減」を切り分けられる前提
 */
const defaultSchedule: VisibilityWindow[] = [
  { state: "visible", durationMs: 14_000 },
  { state: "hidden", durationMs: 2_000 },
  { state: "visible", durationMs: 8_000 },
  { state: "hidden", durationMs: 6_000 },
  { state: "visible", durationMs: 18_000 },
  { state: "hidden", durationMs: 4_000 },
  { state: "visible", durationMs: 22_000 },
  { state: "hidden", durationMs: 12_000 },
  { state: "visible", durationMs: 4_000 },
];

/**
 * `BENCH_VISIBILITY_SCHEDULE` を JSON として解釈する
 * 未指定または不正な内容なら既定 schedule を返す
 * 形式は `[{"state":"visible","durationMs":14000}, ...]`
 */
const readScheduleFromEnv = (raw: string | undefined): VisibilityWindow[] => {
  if (!raw) {
    return defaultSchedule;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultSchedule;
    }

    const windows: VisibilityWindow[] = [];
    for (const entry of parsed) {
      if (entry === null || typeof entry !== "object") {
        return defaultSchedule;
      }

      const candidate = entry as { state?: unknown; durationMs?: unknown };
      if (
        (candidate.state !== "visible" && candidate.state !== "hidden") ||
        typeof candidate.durationMs !== "number" ||
        candidate.durationMs <= 0
      ) {
        return defaultSchedule;
      }

      windows.push({ state: candidate.state, durationMs: candidate.durationMs });
    }

    return windows;
  } catch {
    return defaultSchedule;
  }
};

export const defaultKnobs: CycleKnobs = {
  visibilitySchedule: readScheduleFromEnv(process.env.BENCH_VISIBILITY_SCHEDULE),
  murmurRounds: Number(process.env.BENCH_MURMUR_ROUNDS ?? 5),
  hallwayMessageRounds: Number(process.env.BENCH_HALLWAY_MSG_ROUNDS ?? 5),
  bgmRounds: Number(process.env.BENCH_BGM_ROUNDS ?? 0),
  graceMs: Number(process.env.BENCH_GRACE_MS ?? 32_000),
};

/**
 * BGM サイクルでホストが循環的に選ぶ曲タイトル
 * stop と undo を経るとひとつ前の選曲に戻るので、ラウンドごとに別タイトルを当てて選曲 → 停止 → 取消 のコマンドを毎回新規発火させる
 * `apps/frontend/features/bgm/tracks.ts` のタイトルを採取しており、UI 改名時はここも揃える
 */
const bgmTitleRotation = ["ブルースバラード", "夜のダンス", "ドラマティック", "ドラムストンプ"];

const redisUrl = process.env.BENCH_REDIS_URL ?? "redis://localhost:6379";
const reportDirectory = resolve(import.meta.dirname, "../report");

/**
 * 指定人数で 1 サイクル走らせて MONITOR 集計を JSON に書き出すドライバ
 * Host が `createAsHost` でルームを作り、残りメンバーが `joinAsMember` で合流、Vibe / Murmur / Hallway 一連を回す
 * visibility schedule は bot 間で同一だが開始位相を `(scheduleTotalMs / memberCount) * index` ms ずつずらして全員同期 toggle を防ぐ
 * 結果は `report/{scenario}.json` に書き出して `report.ts` が後段で md にまとめる
 */
export const runCycle = async (
  browser: Browser,
  scenario: string,
  memberCount: number,
  knobs: CycleKnobs = defaultKnobs,
): Promise<CycleSnapshot> => {
  if (memberCount < 2) {
    throw new Error("memberCount は 2 以上が必要 (Hallway 招待にペアが要る)");
  }

  const monitor = new RedisMonitor(redisUrl);
  await monitor.start();

  const contexts: BrowserContext[] = [];
  const bots: Bot[] = [];
  try {
    for (let index = 0; index < memberCount; index += 1) {
      const context = await browser.newContext();
      contexts.push(context);
      const name = index === 0 ? "Host" : `Member${index}`;
      bots.push(await Bot.open(context, name));
    }

    const host = bots[0];
    if (!host) {
      throw new Error("host が初期化されていない");
    }

    const roomId = await host.createAsHost();
    for (let index = 1; index < bots.length; index += 1) {
      const member = bots[index];
      if (!member) {
        continue;
      }

      await member.joinAsMember(roomId);
    }

    const scheduleTotalMs = totalScheduleMs(knobs.visibilitySchedule);
    const offsetStep = Math.floor(scheduleTotalMs / bots.length);
    bots.forEach((bot, index) => {
      bot.startVisibility(knobs.visibilitySchedule, offsetStep * index);
    });

    for (let round = 0; round < knobs.murmurRounds; round += 1) {
      for (const bot of bots) {
        await bot.postMurmur(`${bot.name} の ${round + 1} 発目`);
      }
    }

    const inviter = bots[1];
    const invitee = bots[2 % bots.length];
    if (!inviter || !invitee) {
      throw new Error("Hallway 招待に必要なペアが揃っていない");
    }

    await inviter.inviteHallway(invitee.name);
    await invitee.acceptHallway();
    for (let round = 0; round < knobs.hallwayMessageRounds; round += 1) {
      await inviter.sendHallwayMessage(`${inviter.name} から ${round + 1}`);
      await invitee.sendHallwayMessage(`${invitee.name} から ${round + 1}`);
    }

    await inviter.endHallwayCall();

    if (knobs.bgmRounds > 0) {
      const aide = bots[1];
      if (!aide) {
        throw new Error("BGM サイクルには副の bot が必要、memberCount を 2 以上にする");
      }

      for (let round = 0; round < knobs.bgmRounds; round += 1) {
        const title = bgmTitleRotation[round % bgmTitleRotation.length];
        if (!title) {
          continue;
        }

        await host.pickBgm(title);
        await host.page.waitForTimeout(3_000);
        await aide.stopBgm();
        await host.page.waitForTimeout(1_000);
        await host.undoBgm();
        await host.page.waitForTimeout(4_000);
      }
    }

    for (const bot of bots) {
      await bot.stopVisibility();
    }

    for (const bot of bots) {
      await bot.leave();
    }
  } finally {
    for (const context of contexts) {
      await context.close().catch(() => undefined);
    }
  }

  await new Promise((settle) => setTimeout(settle, knobs.graceMs));

  const tally = await monitor.stop();
  const snapshot: CycleSnapshot = { scenario, memberCount, knobs, tally };

  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(resolve(reportDirectory, `${scenario}.json`), JSON.stringify(snapshot, null, 2));
  return snapshot;
};
