import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Browser, BrowserContext } from "@playwright/test";
import { Bot } from "../bots/bot.js";
import { type CommandTally, RedisMonitor } from "./monitor.js";

/**
 * 1 サイクル分の調整つまみ
 * `visibilityHz` は各メンバーの visibility 切替頻度 (Hz)、`murmurRounds` は全メンバーが順に投稿する周回数
 * `hallwayMessageRounds` は通話中の往復回数、`graceMs` は退室後の grace 30s 経過待ち時間
 */
export type CycleKnobs = {
  visibilityHz: number;
  murmurRounds: number;
  hallwayMessageRounds: number;
  graceMs: number;
};

export type CycleSnapshot = {
  scenario: string;
  memberCount: number;
  knobs: CycleKnobs;
  tally: CommandTally;
};

export const defaultKnobs: CycleKnobs = {
  visibilityHz: Number(process.env.BENCH_VISIBILITY_HZ ?? 0.8),
  murmurRounds: Number(process.env.BENCH_MURMUR_ROUNDS ?? 5),
  hallwayMessageRounds: Number(process.env.BENCH_HALLWAY_MSG_ROUNDS ?? 5),
  graceMs: Number(process.env.BENCH_GRACE_MS ?? 32_000),
};

const redisUrl = process.env.BENCH_REDIS_URL ?? "redis://localhost:6379";
const reportDirectory = resolve(import.meta.dirname, "../report");

/**
 * 指定人数で 1 サイクル走らせて MONITOR 集計を JSON に書き出すドライバ
 * Host が `createAsHost` でルームを作り、残りメンバーが `joinAsMember` で合流、Vibe / Murmur / Hallway 一連を回す
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

    for (const bot of bots) {
      bot.startVisibility(knobs.visibilityHz);
    }

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
