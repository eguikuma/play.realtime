import * as z from "zod";
import { MemberId } from "./member";

/**
 * 再生対象となる BGM 楽曲の識別子一覧
 * 1 ルームあたり厳選した 10 曲に絞ることで曲選びの負担を下げる
 */
export const TrackIds = [
  "Blues",
  "DanceNight",
  "Dramatic",
  "DrumStomp",
  "BassGroove",
  "FunkWalk",
  "ActionRock",
  "PromoRock",
  "Hype",
  "Comedy",
] as const;

/**
 * `TrackIds` のいずれかを表す型付きの楽曲識別子
 * サーバー側での再検証とクライアント UI の選択肢制約を両立させる
 */
export const TrackId = z.enum(TrackIds);
export type TrackId = z.infer<typeof TrackId>;

/**
 * 現在ルームに流れている 1 曲を表す
 * 誰がいつ切り替えたかも保持しておくことで取り消し判定や表示に使う
 */
export const BgmCurrent = z.object({
  trackId: TrackId,
  setBy: MemberId,
  setAt: z.iso.datetime(),
});
export type BgmCurrent = z.infer<typeof BgmCurrent>;

/**
 * undo が可能な時間窓を表す
 * 指定時刻までに本人以外のメンバーが undo を発行すると ひとつ前の曲を現在曲に戻せる
 */
export const BgmUndoable = z.object({
  until: z.iso.datetime(),
  previous: BgmCurrent.nullable(),
  byMemberId: MemberId,
});
export type BgmUndoable = z.infer<typeof BgmUndoable>;

/**
 * ルーム単位の BGM 永続化状態を持つ
 */
export const BgmState = z.object({
  /** 現在流れている曲を持ち 無音のときはなしとなる */
  current: BgmCurrent.nullable(),
  /** undo 窓が開いている間だけ値を持ち 閉じているときはなしとなる */
  undoable: BgmUndoable.nullable(),
});
export type BgmState = z.infer<typeof BgmState>;

/**
 * SSE の購読開始時に該当クライアントへ直送する起動ペイロード
 * 現在の BGM 状態そのものを含む
 */
export const BgmSnapshot = z.object({
  state: BgmState,
});
export type BgmSnapshot = z.infer<typeof BgmSnapshot>;

/**
 * BGM の状態が変化したときルーム全員へ配信するイベント
 * 設定と停止と undo のいずれでも同じ形で配信する
 */
export const BgmChanged = z.object({
  state: BgmState,
});
export type BgmChanged = z.infer<typeof BgmChanged>;

/**
 * SSE でサーバーからクライアントへ送るイベント名とペイロードスキーマの対応表
 * `Snapshot` は接続直後に該当クライアントだけへ直送する
 * `Changed` はルーム全員へ配信する
 */
export const BgmEvents = {
  Snapshot: BgmSnapshot,
  Changed: BgmChanged,
} as const;

/**
 * BGM を設定するリクエスト
 * 楽曲が `TrackIds` の範囲外の場合はドメイン層で `UnknownTrack` を投げる
 */
export const SetBgmRequest = z.object({
  trackId: TrackId,
});
export type SetBgmRequest = z.infer<typeof SetBgmRequest>;
