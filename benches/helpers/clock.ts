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
 * 指定 hz で `visibilityState` を `visible` `hidden` に交互に切り替えるクロック
 * `rateHz` は 1 秒あたりの切替回数、`0.1` なら 10 秒に 1 回切り替わり (= 1 分で 6 回 = 1 時間で 360 回相当の負荷)
 * シナリオは時間圧縮で動かすため、リアル想定 (8h で Vibe 30 churn / h × 8 = 240 churn) を 5 分に詰めるなら `rateHz = 0.8` 程度
 * `start` は背景実行で Promise を返さず、`stop` で内部ループを終わらせる
 */
export class VisibilityCadence {
  private running = false;
  private current: "visible" | "hidden" = "visible";
  private loop: Promise<void> | null = null;

  constructor(
    private readonly page: Page,
    private readonly rateHz: number,
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    const intervalMs = Math.max(50, Math.floor(1000 / this.rateHz));
    this.loop = (async () => {
      while (this.running) {
        this.current = this.current === "visible" ? "hidden" : "visible";
        await setVisibility(this.page, this.current).catch(() => undefined);
        await this.page.waitForTimeout(intervalMs).catch(() => undefined);
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
