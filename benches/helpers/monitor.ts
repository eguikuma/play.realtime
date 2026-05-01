import { Redis } from "ioredis";

/**
 * `RedisMonitor` の集計結果
 * ローカル Redis に流れた全コマンドを種別ごとと キー名前空間ごとに合算する
 * `total` は MONITOR で観測した行数の総和
 * `byCommand` は `publish` `hset` 等の小文字コマンド名で集計
 * `byNamespace` はキー先頭のコロン区切りプレフィックス（`vibe:` `hallway:` `presence:` 等）ごとの発火回数で、機能別の支配率を見るのに使う
 */
export type CommandTally = {
  total: number;
  byCommand: Record<string, number>;
  byNamespace: Record<string, number>;
  durationMs: number;
};

/**
 * ローカル Redis に対して MONITOR を張ってシナリオ間のコマンドを集計するヘルパー
 * Upstash 本番に向けるのではなく、`containers/compose.yml` で立てる ioredis 互換 Redis を前提とする
 * 1 シナリオごとに `start` → 操作 → `stop` を呼び、得た `CommandTally` を `report.ts` に渡す
 */
export class RedisMonitor {
  private readonly base: Redis;
  private channel: Redis | null = null;
  private readonly records: Array<{ command: string; key: string | undefined }> = [];
  private startedAt = 0;
  private stoppedAt = 0;

  constructor(redisUrl: string) {
    this.base = new Redis(redisUrl);
  }

  async start(): Promise<void> {
    this.records.length = 0;
    this.startedAt = Date.now();
    const channel = await this.base.monitor();
    this.channel = channel;
    channel.on("monitor", (_time: string, tokens: unknown[]) => {
      if (!Array.isArray(tokens) || tokens.length === 0) {
        return;
      }

      const [command, key] = tokens;
      this.records.push({
        command: String(command).toLowerCase(),
        key: key === undefined ? undefined : String(key),
      });
    });
  }

  async stop(): Promise<CommandTally> {
    this.stoppedAt = Date.now();
    if (this.channel) {
      this.channel.disconnect();
      this.channel = null;
    }

    await this.base.quit();
    return this.tally();
  }

  private tally(): CommandTally {
    const byCommand: Record<string, number> = {};
    const byNamespace: Record<string, number> = {};
    for (const record of this.records) {
      byCommand[record.command] = (byCommand[record.command] ?? 0) + 1;
      const namespace = this.namespaceOf(record.key);
      if (namespace) {
        byNamespace[namespace] = (byNamespace[namespace] ?? 0) + 1;
      }
    }
    return {
      total: this.records.length,
      byCommand,
      byNamespace,
      durationMs: this.stoppedAt - this.startedAt,
    };
  }

  private namespaceOf(key: string | undefined): string | undefined {
    if (!key) {
      return undefined;
    }

    const colon = key.indexOf(":");
    if (colon < 0) {
      return undefined;
    }

    return key.slice(0, colon);
  }
}
