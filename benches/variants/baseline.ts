import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 直近のシナリオ実行 (`report/*.json`) を `variants/baseline/` にコピーして基準値として保管する
 * フェーズ A の最後に 1 回叩いて、フェーズ B の改善後計測 (`variants/throttle/`) と比較するための土台を作る
 * 既存の baseline は上書きする想定、複数世代を取りたいなら本スクリプトを複製して別名にする
 */

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(root, "report");
const snapshotDirectory = resolve(root, "variants", "baseline");

const main = (): void => {
  if (!existsSync(sourceDirectory)) {
    throw new Error(`source 不在 ${sourceDirectory}、先にシナリオを走らせる必要がある`);
  }

  mkdirSync(snapshotDirectory, { recursive: true });
  let copied = 0;
  for (const filename of readdirSync(sourceDirectory)) {
    if (!filename.endsWith(".json")) {
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
