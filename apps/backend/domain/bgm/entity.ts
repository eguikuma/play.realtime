import type { BgmState, MemberId, TrackId } from "@play.realtime/contracts";
import { TrackIds } from "@play.realtime/contracts";
import { UndoBySelf, UndoExpired, UndoUnavailable, UnknownTrack } from "./errors";

/**
 * undo 窓の長さ
 * 変更直後の 10 秒間だけ 他のメンバーが戻せる時間窓として使う
 */
const UNDO_WINDOW_MS = 10_000;

/**
 * 高速な検証のために `TrackIds` を集合として持ったキャッシュ
 */
const VALID_TRACK_IDS = new Set<string>(TrackIds);

/**
 * 無音で undo 窓も持たない初期状態を返す
 * 永続化の取得がなしを返したときの代替値として使う
 */
export const empty = (): BgmState => ({ current: null, undoable: null });

/**
 * BGM を設定して undo 窓を開く
 * 現在曲には新しい楽曲を載せ 直前まで流れていた曲は取り消し候補として退避する
 * 未登録の楽曲を指定した場合は `UnknownTrack` を投げる
 */
export const set = (
  state: BgmState,
  input: { trackId: TrackId; memberId: MemberId; now: Date },
): BgmState => {
  if (!VALID_TRACK_IDS.has(input.trackId)) {
    throw new UnknownTrack(input.trackId);
  }
  return {
    current: {
      trackId: input.trackId,
      setBy: input.memberId,
      setAt: input.now.toISOString(),
    },
    undoable: openWindow(state, input.memberId, input.now),
  };
};

/**
 * BGM を無音にして undo 窓を開く
 * 現在曲はなしになり 直前まで流れていた曲は取り消し候補として退避する
 */
export const stop = (state: BgmState, input: { memberId: MemberId; now: Date }): BgmState => {
  return {
    current: null,
    undoable: openWindow(state, input.memberId, input.now),
  };
};

/**
 * undo 窓の中で起きた変更を 他のメンバーが取り消す
 * 本人からの undo は `UndoBySelf` 窓が閉じているなら `UndoExpired` 窓が無いなら `UndoUnavailable` を投げる
 * 成功時は現在曲を直前の曲に戻し undo 窓は閉じる (undo の undo は許さない)
 */
export const undo = (state: BgmState, input: { memberId: MemberId; now: Date }): BgmState => {
  const { undoable } = state;
  if (!undoable) {
    throw new UndoUnavailable();
  }
  if (undoable.byMemberId === input.memberId) {
    throw new UndoBySelf(input.memberId);
  }
  if (input.now.getTime() > new Date(undoable.until).getTime()) {
    throw new UndoExpired();
  }
  return {
    current: undoable.previous,
    undoable: null,
  };
};

/**
 * 設定と停止で共通して使う undo 窓の組み立て処理
 * 直前の現在曲を退避し 変更者のメンバー ID は本人 undo を防ぐ判定に使う
 */
const openWindow = (state: BgmState, memberId: MemberId, now: Date) => ({
  until: new Date(now.getTime() + UNDO_WINDOW_MS).toISOString(),
  previous: state.current,
  byMemberId: memberId,
});
