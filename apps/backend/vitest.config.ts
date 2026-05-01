import { defineConfig } from "vitest/config";

/**
 * バックエンドの Vitest 実行設定
 * Node 環境でテストファイルのみを拾い グローバルを切って test 関数を明示的に取り込ませる
 */
export default defineConfig({
  test: {
    globals: false,
    include: ["**/*.test.ts"],
    environment: "node",
  },
});
