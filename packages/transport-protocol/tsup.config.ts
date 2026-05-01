import { defineConfig } from "tsup";

/**
 * transport-protocol パッケージのビルド定義
 * SSE と WebSocket の通信路で使う定数を CJS と ESM の両方で出力する
 */
export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  /**
   * tsup 8.5.1 が DTS 生成時に baseUrl を無条件注入する egoist/tsup#1388 の回避策
   * TypeScript 6.0 で baseUrl が非推奨となり DTS ビルドのみ失敗するため DTS の範囲に限って ignoreDeprecations を指定する
   */
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  clean: true,
  sourcemap: true,
  target: "node22",
});
