import { env, exit, stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { Redis } from "ioredis";

/**
 * 1 つの ioredis 接続を張りっぱなしにしたまま Enter キーで snapshot を取り続ける対話型観測スクリプト
 *
 * Upstash Free が新規 TCP 接続のたびに別ノードへルーティングするため、`stats:snapshot` を別プロセスで複数回叩くと
 * INFO stats の `total_commands_processed` がノードごとに別値になり差分が成立しない
 * このスクリプトは 1 接続に固定することで全 snapshot が同一ノード経由になり、差分を信頼できる値として扱える
 *
 * 操作
 * - Enter キー単押し snapshot を 1 つ取り、前回からの差分とセッション開始からの累積を併記する
 * - q + Enter / Ctrl+C 接続を閉じて終了する
 */

function loadRedisUrl(): string {
  const value = env.REDIS_URL;

  if (!value) {
    console.error("REDIS_URL 環境変数が必要");
    console.error("Render Dashboard の Environment タブから REDIS_URL をコピーして実行例");
    console.error(
      '  REDIS_URL="rediss://default:..." pnpm -F @play.realtime/benches stats:session',
    );
    exit(1);
  }

  return value;
}

const redisUrl = loadRedisUrl();

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

  const sessionStart = await readCounter(redis);
  let previous = sessionStart;
  let snapshotCount = 0;

  console.info(
    JSON.stringify(
      {
        event: "session-opened",
        sessionStart,
        note: "Enter キーで snapshot を取得し、q + Enter で終了する",
      },
      null,
      2,
    ),
  );

  const reader = createInterface({ input: stdin, output: stdout });

  const close = async (): Promise<void> => {
    reader.close();
    await redis.quit();
    console.info(
      JSON.stringify(
        {
          event: "session-closed",
          totalSnapshots: snapshotCount,
        },
        null,
        2,
      ),
    );
    exit(0);
  };

  reader.on("line", (line) => {
    const trimmed = line.trim().toLowerCase();
    if (trimmed === "q" || trimmed === "quit" || trimmed === "exit") {
      void close();
      return;
    }

    void readCounter(redis)
      .then((counter) => {
        snapshotCount += 1;
        const delta = counter - previous;
        const totalFromStart = counter - sessionStart;
        console.info(
          JSON.stringify(
            {
              snapshot: snapshotCount,
              at: new Date().toISOString(),
              counter,
              delta,
              totalFromStart,
            },
            null,
            2,
          ),
        );
        previous = counter;
      })
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : String(error));
      });
  });

  reader.on("SIGINT", () => {
    void close();
  });
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
