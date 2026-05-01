import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 直近のシナリオ実行 (`report/*.json`) を `variants/with-bgm-cycle/` にコピーして候補 3 BGM サイクル組み込み後の数値として保管する
 * baseline と throttle と no-hexists と room-cache と no-vibe-multi と並べて、ホストが選曲 → 停止 → 取消 を回したときの bgm namespace 実コマンド数を `report.ts` で並べる
 * 走らせる前に `BENCH_BGM_ROUNDS=2 pnpm -F @play.realtime/benches bench` を打つ必要がある
 * env なしのまま走らせると BGM サイクル不在の数値が混ざる
 * 既存の with-bgm-cycle は上書きする想定、複数世代を取りたいなら本スクリプトを複製して別名にする
 */

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(root, "report");
const snapshotDirectory = resolve(root, "variants", "with-bgm-cycle");

const main = (): void => {
  if (!existsSync(sourceDirectory)) {
    throw new Error(`source 不在 ${sourceDirectory}、先にシナリオを走らせる必要がある`);
  }

  mkdirSync(snapshotDirectory, { recursive: true });
  let copied = 0;
  for (const filename of readdirSync(sourceDirectory)) {
    if (!filename.startsWith("room-") || !filename.endsWith(".json")) {
      continue;
    }

    const source = resolve(sourceDirectory, filename);
    if (!statSync(source).isFile()) {
      continue;
    }

    copyFileSync(source, resolve(snapshotDirectory, filename));
    copied += 1;
  }

  console.info(`copied ${copied} file(s) into ${snapshotDirectory}`);
};

main();
