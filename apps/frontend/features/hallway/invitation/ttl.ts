/**
 * クライアント側カウントダウン UI の最大窓幅、サーバ側 `INVITATION_TTL_MS` と同じ 10 秒に揃える
 * 実際の期限切れはサーバ側タイマーが決め、こちらはプログレス表示の基準値としてのみ使う
 */
export const INVITATION_TTL_MS = 10_000;
