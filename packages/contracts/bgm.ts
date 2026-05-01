import * as z from "zod";
import { MemberId } from "./member";
import type { RoomId } from "./room";

/**
 * 選択可能な BGM トラック ID の固定リスト
 * Pixabay から事前に選定した 10 曲を読み込み対象とし、この列挙にない値は受け付けない
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
 * `TrackIds` から作られた BGM トラック 1 つを指す enum
 * サーバ側・クライアント側のどちらも同じ列挙を Zod 経由で検証できる
 */
export const TrackId = z.enum(TrackIds);
export type TrackId = z.infer<typeof TrackId>;

/**
 * ルームで現在再生中の 1 曲を表す
 * ルームは 1 つしか曲を持てない設計のため、複数曲のキューではなく 1 件の現在値として扱う
 */
export const BgmCurrent = z.object({
  /** 再生中のトラック ID */
  trackId: TrackId,
  /** 現在の曲に切り替えた操作者の `MemberId` */
  setBy: MemberId,
  /** 現在の曲に切り替えた時刻を ISO 8601 形式で保持する */
  setAt: z.iso.datetime(),
});
export type BgmCurrent = z.infer<typeof BgmCurrent>;

/**
 * 直前の BGM 操作を取り消せる undo 窓の内容
 * 曲の切り替えや停止が行われた直後の一定時間だけ値を持ち、時間が過ぎると `BgmState.undoable` 側が `null` に戻る
 */
export const BgmUndoable = z.object({
  /** undo 窓が閉じる時刻、これを過ぎると取り消し操作は受け付けない */
  until: z.iso.datetime(),
  /** 取り消した場合に復元する直前の再生状態、停止状態から切り替えた場合は `null` */
  previous: BgmCurrent.nullable(),
  /** この undo 窓を開いた操作者の `MemberId`、操作者以外からの取り消しを防ぐ判定に使う */
  byMemberId: MemberId,
});
export type BgmUndoable = z.infer<typeof BgmUndoable>;

/**
 * ルームにおける BGM の現在状態を合成した値
 * 再生中 / 停止中 / undo 可能 / undo 不可の 4 つの状況を `null` 許容の 2 フィールドで表現する
 */
export const BgmState = z.object({
  /** 現在流れている曲、無音のときは `null` */
  current: BgmCurrent.nullable(),
  /** undo 窓が開いている間だけ値を持つ、閉じていれば `null` */
  undoable: BgmUndoable.nullable(),
});
export type BgmState = z.infer<typeof BgmState>;

/**
 * BGM SSE の購読開始直後に 1 度だけ送る `Snapshot` イベント
 * 現時点の再生状態と undo 窓の状況をまとめて配信し、遅れて参加したクライアントも正しい画面を描ける
 */
export const BgmSnapshot = z.object({
  /** 合成済みの BGM 現在状態 */
  state: BgmState,
});
export type BgmSnapshot = z.infer<typeof BgmSnapshot>;

/**
 * 誰かが BGM を操作したときに逐次届く `Changed` イベント
 * 曲の切り替え、停止、undo のいずれでも合成後の `BgmState` を 1 回配信する
 */
export const BgmChanged = z.object({
  /** 操作後の合成済み BGM 現在状態 */
  state: BgmState,
});
export type BgmChanged = z.infer<typeof BgmChanged>;

/**
 * BGM SSE でサーバからクライアントへ配信する全イベント名と対応する schema のマップ
 * サーバ側の配信ディスパッチ、クライアント側の受信パースで共通の参照表として使う
 */
export const BgmEvents = {
  /** 購読開始直後に 1 度だけ届く、現在状態の一括配信 */
  Snapshot: BgmSnapshot,
  /** 操作による状態変化を逐次届ける配信 */
  Changed: BgmChanged,
} as const;

/**
 * `PUT /rooms/{roomId}/bgm` のリクエストボディ契約
 * 再生したいトラック ID をクライアントから送り、サーバ側が `BgmState` への反映と undo 窓の更新を担当する
 */
export const SetBgmRequest = z.object({
  /** 再生を指示するトラック ID */
  trackId: TrackId,
});
export type SetBgmRequest = z.infer<typeof SetBgmRequest>;

/**
 * BGM 関連 HTTP エンドポイントの URL を組み立てる定数
 * フロントエンドの呼び出し側とバックエンドの Controller 側で URL の食い違いを起こさないよう、両者がこの定数を経由する前提で配置する
 */
export const BgmEndpoint = {
  /** `GET /rooms/{roomId}/bgm/stream` SSE 購読経路 */
  stream: (roomId: RoomId) => `/rooms/${roomId}/bgm/stream`,
  /** `POST /rooms/{roomId}/bgm` 再生トラックの切替 */
  set: (roomId: RoomId) => `/rooms/${roomId}/bgm`,
  /** `POST /rooms/{roomId}/bgm/stop` 再生停止 */
  stop: (roomId: RoomId) => `/rooms/${roomId}/bgm/stop`,
  /** `POST /rooms/{roomId}/bgm/undo` 直前操作の取り消し */
  undo: (roomId: RoomId) => `/rooms/${roomId}/bgm/undo`,
} as const;
