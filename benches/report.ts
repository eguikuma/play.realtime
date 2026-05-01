import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { totalScheduleMs } from "./helpers/clock.js";
import type { CycleSnapshot } from "./helpers/cycle.js";

/**
 * `report/*.json` (最新シナリオ実行) と `variants/<name>/*.json` (スナップショット) を読み込んで、Redis MONITOR の集計結果を Markdown 1 枚にまとめる
 * 変動をシナリオ × variant の表で並べ、コマンド種別 / キー名前空間ごとの内訳もそれぞれ出す
 */

const root = resolve(import.meta.dirname);
const reportDirectory = resolve(root, "report");
const variantsDirectory = resolve(root, "variants");
const summaryPath = resolve(reportDirectory, "summary.md");

type VariantBundle = {
  name: string;
  snapshots: CycleSnapshot[];
};

const readSnapshots = (directory: string): CycleSnapshot[] => {
  if (!existsSync(directory)) {
    return [];
  }

  const entries: CycleSnapshot[] = [];
  for (const filename of readdirSync(directory)) {
    if (!filename.endsWith(".json")) {
      continue;
    }

    const path = resolve(directory, filename);
    if (!statSync(path).isFile()) {
      continue;
    }

    const raw = readFileSync(path, "utf-8");
    const candidate = JSON.parse(raw) as Partial<CycleSnapshot>;
    if (!candidate.scenario || !candidate.tally || typeof candidate.memberCount !== "number") {
      continue;
    }

    entries.push(candidate as CycleSnapshot);
  }

  return entries.sort((left, right) => left.scenario.localeCompare(right.scenario));
};

const readVariants = (): VariantBundle[] => {
  if (!existsSync(variantsDirectory)) {
    return [];
  }

  const bundles: VariantBundle[] = [];
  for (const name of readdirSync(variantsDirectory)) {
    const path = resolve(variantsDirectory, name);
    if (!statSync(path).isDirectory()) {
      continue;
    }

    bundles.push({ name, snapshots: readSnapshots(path) });
  }

  return bundles.sort((left, right) => left.name.localeCompare(right.name));
};

const formatNumber = (value: number): string => value.toLocaleString("en-US");

const formatBreakdown = (record: Record<string, number>): string => {
  const rows = Object.entries(record).sort(([, left], [, right]) => right - left);
  if (rows.length === 0) {
    return "(none)";
  }

  const header = "| 種別 | 回数 |\n|---|---:|";
  const body = rows.map(([key, count]) => `| ${key} | ${formatNumber(count)} |`).join("\n");
  return `${header}\n${body}`;
};

const formatSnapshot = (snapshot: CycleSnapshot): string => {
  const seconds = (snapshot.tally.durationMs / 1000).toFixed(1);
  const scheduleSeconds = (totalScheduleMs(snapshot.knobs.visibilitySchedule) / 1000).toFixed(0);
  const scheduleWindows = snapshot.knobs.visibilitySchedule.length;
  return [
    `### ${snapshot.scenario} (${snapshot.memberCount} 人)`,
    "",
    `- 計測時間: ${seconds} 秒`,
    `- Redis コマンド合計: ${formatNumber(snapshot.tally.total)}`,
    `- knobs: visibilitySchedule=${scheduleWindows}区間/${scheduleSeconds}s murmurRounds=${snapshot.knobs.murmurRounds} hallwayMessageRounds=${snapshot.knobs.hallwayMessageRounds} bgmRounds=${snapshot.knobs.bgmRounds ?? 0} graceMs=${snapshot.knobs.graceMs}`,
    "",
    "#### コマンド種別",
    "",
    formatBreakdown(snapshot.tally.byCommand),
    "",
    "#### キー名前空間",
    "",
    formatBreakdown(snapshot.tally.byNamespace),
    "",
  ].join("\n");
};

const formatBundle = (label: string, snapshots: CycleSnapshot[]): string => {
  if (snapshots.length === 0) {
    return `## ${label}\n\n(計測結果なし)\n`;
  }

  return [`## ${label}`, "", ...snapshots.map(formatSnapshot)].join("\n");
};

const main = (): void => {
  const latest = readSnapshots(reportDirectory);
  const variants = readVariants();

  const sections: string[] = [];
  sections.push(`# Bench Report`);
  sections.push("");
  sections.push(`生成 ${new Date().toISOString()}`);
  sections.push("");
  sections.push(formatBundle("Latest", latest));

  for (const variant of variants) {
    sections.push(formatBundle(`Variant: ${variant.name}`, variant.snapshots));
  }

  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(summaryPath, sections.join("\n"));
  console.info(`wrote ${summaryPath}`);
};

main();
