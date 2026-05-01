/**
 * Tailwind v4 を PostCSS から適用する設定
 * 追加 plugin は持たずシンプルなビルドチェーンを維持する
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
