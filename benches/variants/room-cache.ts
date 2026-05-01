import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 直近のシナリオ実行 (`report/*.json`) を `variants/room-cache/` にコピーして候補 D 副次の改善後の数値として保管する
 * baseline と throttle と no-hexists と並べて `CachingRoomRepository` 導入による room namespace 削減率を `report.ts` で並べる
 * 既存の room-cache は上書きする想定、複数世代を取りたいなら本スクリプトを複製して別名にする
 */

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(root, "report");
const snapshotDirectory = resolve(root, "variants", "room-cache");

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
