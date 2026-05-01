import type { BrowserContext, Page } from "@playwright/test";
import { VisibilityCadence, type VisibilityWindow } from "../helpers/clock.js";

/**
 * 1 メンバー分のシナリオ実行を担う bot
 * Playwright `Page` を抱えて landing or entrance からの入室、ルーム内での Vibe / Murmur / BGM / Hallway 操作、退室までを 1 メソッド単位で公開する
 * ステージ表示は `aria-label` と role+name を主軸に拾う、selector が壊れたらここを起点に直す
 */
export class Bot {
  private cadence: VisibilityCadence | null = null;

  private constructor(
    public readonly name: string,
    public readonly page: Page,
  ) {}

  static async open(context: BrowserContext, name: string): Promise<Bot> {
    const page = await context.newPage();
    return new Bot(name, page);
  }

  async createAsHost(): Promise<string> {
    await this.page.goto("/");
    await this.page.locator("#host-name").fill(this.name);
    await this.page.getByRole("button", { name: "部屋をつくる" }).click();
    await this.page.waitForURL(/\/rooms\/[^/]+$/);
    const url = new URL(this.page.url());
    const segments = url.pathname.split("/");
    const roomId = segments[segments.length - 1];
    if (!roomId) {
      throw new Error("room id を URL から取得できなかった");
    }

    await this.waitStage();
    return roomId;
  }

  async joinAsMember(roomId: string): Promise<void> {
    await this.page.goto(`/rooms/${roomId}`);
    await this.page.locator("#member-name").fill(this.name);
    await this.page.getByRole("button", { name: "そっと入室する" }).click();
    await this.waitStage();
  }

  startVisibility(schedule: VisibilityWindow[], offsetMs: number): void {
    this.cadence = new VisibilityCadence(this.page, schedule, offsetMs);
    this.cadence.start();
  }

  async stopVisibility(): Promise<void> {
    if (this.cadence) {
      await this.cadence.stop();
      this.cadence = null;
    }
  }

  async postMurmur(text: string): Promise<void> {
    const input = this.page.getByPlaceholder("いま、思いついたこと");
    await input.fill(text);
    await input.press("Enter");
  }

  async openBgmPanel(): Promise<void> {
    await this.page.getByRole("button", { name: "作業音を開く" }).click();
  }

  async pickFirstBgm(): Promise<void> {
    await this.openBgmPanel();
    const firstTrack = this.page.getByRole("button").filter({ hasText: /^.+$/ }).nth(0);
    await firstTrack.click();
  }

  async pauseBgm(): Promise<void> {
    await this.page.getByRole("button", { name: "一時停止" }).click();
  }

  async resumeBgm(): Promise<void> {
    await this.page.getByRole("button", { name: "再生" }).click();
  }

  async inviteHallway(inviteeName: string): Promise<void> {
    await this.page.getByRole("button", { name: `${inviteeName}に話しかける` }).click();
  }

  async acceptHallway(): Promise<void> {
    await this.page.getByRole("button", { name: "応じる" }).click();
  }

  async sendHallwayMessage(text: string): Promise<void> {
    const input = this.page.getByPlaceholder("いま、話そう");
    await input.fill(text);
    await this.page.getByRole("button", { name: "送る" }).click();
  }

  async endHallwayCall(): Promise<void> {
    await this.page.getByRole("button", { name: "通話を終了" }).click();
  }

  async leave(): Promise<void> {
    await this.stopVisibility();
    await this.page.close();
  }

  private async waitStage(): Promise<void> {
    await this.page.waitForURL(/\/rooms\/[^/]+$/);
    await this.page
      .getByPlaceholder("いま、思いついたこと")
      .waitFor({ state: "visible", timeout: 15000 });
  }
}
