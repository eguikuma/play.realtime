import type { BgmState, MemberId, TrackId } from "@play.realtime/contracts";
import { TrackIds } from "@play.realtime/contracts";
import { UndoBySelf, UndoExpired, UndoUnavailable, UnknownTrack } from "./errors";

/**
 * undo 窓が開いている時間、操作直後のこのミリ秒内だけ他メンバーから取り消しできる
 */
const UNDO_WINDOW_MS = 10_000;

const ValidTrackIds = new Set<string>(TrackIds);

/**
 * BGM を未再生の初期状態で作る純粋関数、`current` と `undoable` の両方が `null` になる
 */
export const empty = (): BgmState => ({ current: null, undoable: null });

/**
 * 新しいトラックへ切り替えた `BgmState` を返す純粋関数
 * `trackId` が許可リスト外なら `UnknownTrack` を投げる、直前の状態を `undoable.previous` に退避して undo 窓を開く
 */
export const set = (
  state: BgmState,
  input: { trackId: TrackId; memberId: MemberId; now: Date },
): BgmState => {
  if (!ValidTrackIds.has(input.trackId)) {
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
 * 再生を停止した `BgmState` を返す純粋関数、`current` を `null` に落とし、undo 窓を開いて直前状態を退避する
 */
export const stop = (state: BgmState, input: { memberId: MemberId; now: Date }): BgmState => {
  return {
    current: null,
    undoable: openWindow(state, input.memberId, input.now),
  };
};

/**
 * undo 窓を使って直前の BGM 状態へ戻す純粋関数
 * 操作者本人による undo は禁止、`UndoBySelf` を投げる
 * 窓が閉じている場合は `UndoUnavailable`、期限超過は `UndoExpired` を投げる
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
 * undo 窓を開いて、復元対象となる直前状態と操作者 / 失効時刻を束ねた `BgmUndoable` を作る
 */
const openWindow = (state: BgmState, memberId: MemberId, now: Date) => ({
  until: new Date(now.getTime() + UNDO_WINDOW_MS).toISOString(),
  previous: state.current,
  byMemberId: memberId,
});
