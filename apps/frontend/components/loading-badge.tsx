/**
 * 画面全体を埋める読み込み中バッジ
 * `min-h-svh` で最低でもビューポート高を確保し、中央に脈打つ lamp 色のドットを配置する
 * `aria-busy` と `role="status"` を付け、スクリーンリーダーに「読み込み中」であることが伝わるようにする
 */
export const LoadingBadge = () => {
  return (
    <div
      aria-label="読み込み中"
      aria-busy="true"
      role="status"
      className="flex min-h-svh items-center justify-center"
    >
      <span aria-hidden className="relative flex size-10 items-center justify-center">
        <span
          className="absolute inset-0 animate-breath rounded-full"
          style={{
            boxShadow: "0 0 0 2px var(--lamp), 0 0 32px 4px oklch(from var(--lamp) l c h / 0.5)",
          }}
        />
        <span className="size-2.5 rounded-full bg-lamp" />
      </span>
    </div>
  );
};
