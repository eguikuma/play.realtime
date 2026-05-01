import { argv, env, exit } from "node:process";
import { Redis } from "ioredis";

/**
 * 本番 Upstash Redis に `INFO stats` を 1 発叩いて `total_commands_processed` を取得するだけの観測スクリプト
 *
 * 段階 1 マイクロ検算では UI で 1 op を叩く前後にこのスクリプトを 1 回ずつ実行し、差分を 1 op 単位の cmd 数として読み取る
 * 段階 2 24h アイドルでは 開始 / 12h / 24h の 3 点で実行し、増分を隠れた消費源の総和として読み取る
 *
 * `--calibrate` を渡すと INFO を 2 連発して `overheadPerInfo` を実測する
 * Upstash 側が自分の INFO 呼び出しを cmd として計上しているかどうかを最初に確定するための校正モード
 */

function loadRedisUrl(): string {
  const value = env.REDIS_URL;
  if (!value) {
    console.error("REDIS_URL 環境変数が必要");
    console.error("Render Dashboard の Environment タブから REDIS_URL をコピーして実行例");
    console.error(
      '  REDIS_URL="rediss://default:..." pnpm -F @play.realtime/benches stats:snapshot',
    );
    exit(1);
  }
  return value;
}

const redisUrl = loadRedisUrl();

const shouldCalibrate = argv.includes("--calibrate");

async function readCounter(redis: Redis): Promise<number> {
  const stats = await redis.info("stats");
  const match = stats.match(/total_commands_processed:(\d+)/);
  if (!match) {
    throw new Error(
      "INFO stats に total_commands_processed が含まれない、Upstash プランの制限で INFO サブコマンドが封じられている可能性",
    );
  }
  const captured = match[1];
  if (captured === undefined) {
    throw new Error("INFO stats の total_commands_processed が空");
  }
  const value = Number(captured);
  if (!Number.isFinite(value)) {
    throw new Error(`INFO stats から数値化できない total_commands_processed=${captured}`);
  }
  return value;
}

async function main(): Promise<void> {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10_000,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  try {
    const at = new Date().toISOString();
    const counter = await readCounter(redis);
    const output: Record<string, unknown> = { at, counter };

    if (shouldCalibrate) {
      const second = await readCounter(redis);
      output["secondCounter"] = second;
      output["overheadPerInfo"] = second - counter;
      output["note"] =
        "overheadPerInfo が 1 なら INFO 自身が cmd として計上されている、0 なら計上対象外、それ以外なら別経路の発火が混在";
    }

    console.info(JSON.stringify(output, null, 2));
  } finally {
    await redis.quit();
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(String(error));
  }
  exit(1);
});
