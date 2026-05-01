import type { Page } from "@playwright/test";

/**
 * `document.visibilityState` を一方の値に固定して `visibilitychange` を発火するヘルパー
 * Playwright は実ブラウザのため `visibilityState` は通常 `visible` 固定になり、`useVisibility` の購読を駆動できない
 * `page.evaluate` 内で getter を上書きすることで `present` と `focused` の遷移をスクリプトから制御する
 */
export const setVisibility = async (page: Page, state: "visible" | "hidden"): Promise<void> => {
  await page.evaluate((value) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
};

/**
 * 1 区間分の visibility 状態と滞在時間
 * `state` の状態に切り替えてから `durationMs` 待機し、次の区間に進む
 */
export type VisibilityWindow = {
  state: "visible" | "hidden";
  durationMs: number;
};

/**
 * `schedule` 配列で滞在時間を明示する visibility クロック
 * 配列を先頭から順に適用してループし、各区間ごとに `setVisibility` で状態を切り替えてから `durationMs` 待機する
 * `offsetMs` は bot 間の位相をずらすための初期待機、bot N 番目に `(scheduleTotalMs / botCount) * N` を渡すと全員同期 toggle を避けられる
 * Phase B のデバウンス評価では window 未満の短い hidden で吸収シーンを、window 以上の長い hidden で確実に拾われるシーンを 1 周に共存させる
 */
export class VisibilityCadence {
  private running = false;
  private loop: Promise<void> | null = null;

  constructor(
    private readonly page: Page,
    private readonly schedule: VisibilityWindow[],
    private readonly offsetMs: number,
  ) {
    if (schedule.length === 0) {
      throw new Error("schedule に最低 1 区間必要");
    }
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.loop = (async () => {
      if (this.offsetMs > 0) {
        await this.page.waitForTimeout(this.offsetMs).catch(() => undefined);
      }

      let cursor = 0;
      while (this.running) {
        const window = this.schedule[cursor];
        if (!window) {
          cursor = 0;
          continue;
        }

        await setVisibility(this.page, window.state).catch(() => undefined);
        await this.page.waitForTimeout(window.durationMs).catch(() => undefined);
        cursor = (cursor + 1) % this.schedule.length;
      }
    })();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.loop) {
      await this.loop;
      this.loop = null;
    }

    await setVisibility(this.page, "visible").catch(() => undefined);
  }
}

/**
 * 1 周分の合計時間を算出するヘルパー、cycle.ts で bot 間の位相オフセットを計算するのに使う
 */
export const totalScheduleMs = (schedule: VisibilityWindow[]): number =>
  schedule.reduce((sum, window) => sum + window.durationMs, 0);
