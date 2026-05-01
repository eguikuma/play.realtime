"use client";

/**
 * `RootLayout` のレンダリング自体が失敗したときに Next.js が表示する最終フォールバック
 * 通常の `error.tsx` とは異なり `ThemeProvider` やグローバル CSS も読まれていないため、HTML / スタイルをインラインで完結させる必要がある
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
          backgroundColor: "#fafaf7",
          color: "#222",
        }}
      >
        <div style={{ maxWidth: "480px", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 16px", fontSize: "28px", fontWeight: 700 }}>
            画面を表示できませんでした
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "14px", lineHeight: 1.7, opacity: 0.75 }}>
            再読み込みしても戻らないときは、少し時間を置いて試してみてください
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: "44px",
              padding: "0 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              color: "#fff",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
        </div>
      </body>
    </html>
  );
}
