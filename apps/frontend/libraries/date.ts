/**
 * ISO 8601 文字列をローカルタイムゾーンの `HH:mm` 形式へ整形するヘルパ
 * タイムライン表示でタイムゾーン情報ごと流れてきた値を、クライアント側の受信時間帯に揃えて描画するために使う
 */
export const toHHMM = (iso: string) => {
  const date = new Date(iso);

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
