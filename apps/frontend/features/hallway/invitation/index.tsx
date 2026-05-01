"use client";

import { Dot } from "../dot";
import { Countdown } from "./countdown";
import { INVITATION_TTL_MS } from "./ttl";

type Invitation = {
  /** 呼びかけている相手の表示名、カードの主語として使う */
  fromName: string;
  /** この招待が失効する時刻、ISO 8601 文字列、残り時間の計算とアニメーションの基準にする */
  expiresAt: string;
  /** 応じるボタンを押したときに親へ通知するコールバック */
  onAccept: () => void;
  /** いまは無理ボタンを押したときに親へ通知するコールバック */
  onDecline: () => void;
};

/**
 * 画面右上に差し込まれる着信招待カード
 * 経過時間ぶんマイナス方向に `animationDelay` を設定することで、カードが途中からマウントされたときも CSS animation を残り時間に合わせて進行させる
 */
export const Invitation = ({ fromName, expiresAt, onAccept, onDecline }: Invitation) => {
  const elapsed = INVITATION_TTL_MS - Math.max(0, new Date(expiresAt).getTime() - Date.now());

  return (
    <div
      role="dialog"
      aria-label="廊下トークの招待"
      className="pointer-events-auto animate-slip-in"
      style={{ transform: "rotate(-1.2deg)" }}
    >
      <div
        className="relative max-w-[min(320px,calc(100vw-3rem))] rounded-md border border-rule bg-paper-2/95 p-5 shadow-[0_24px_48px_-20px_oklch(from_var(--ink)_l_c_h/0.3),0_2px_0_var(--rule)] backdrop-blur-md"
        style={{
          animation: `invitation-slip-tail ${INVITATION_TTL_MS}ms linear forwards`,
          animationDelay: `-${elapsed}ms`,
        }}
      >
        <span
          aria-hidden
          className="absolute -top-1 -right-1 size-3 rotate-45 bg-paper shadow-[0_1px_0_var(--rule)]"
        />
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 self-start rounded-pill bg-lamp-soft/60 px-2.5 py-0.5 font-medium font-sans text-[11px] text-lamp">
            <Dot className="inline-flex size-1" />
            話したいって
          </span>
          <p className="font-display text-[20px] text-ink leading-snug">
            <span className="font-bold">{fromName}</span>
            <span className="text-ink-soft">さんが、</span>
            <br />
            <span className="text-ink-soft">少し話したいそうです</span>
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 rounded-md bg-ink py-2 font-sans text-[13px] text-paper transition-opacity hover:opacity-90"
            >
              応じる
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="flex-1 rounded-md border border-rule bg-paper py-2 font-sans text-[13px] text-ink-soft transition-colors hover:bg-paper-2"
            >
              いまは無理
            </button>
          </div>
          <Countdown elapsed={elapsed} />
        </div>
      </div>
    </div>
  );
};
