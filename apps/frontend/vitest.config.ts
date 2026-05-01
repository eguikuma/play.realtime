import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * frontend の Vitest 実行設定
 * happy-dom 環境で *.test.ts と *.test.tsx を拾い node_modules と .next は除外する
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    globals: false,
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
});
