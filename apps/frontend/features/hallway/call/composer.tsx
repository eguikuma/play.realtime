"use client";

import { Send } from "lucide-react";
import type { SyntheticEvent } from "react";
import { Input } from "@/components/ui/input";

type Composer = {
  /** 現在の入力文字列 */
  text: string;
  /** 送信可能かどうか、空白のみの入力などで false にして送信ボタンを無効化する */
  canSubmit: boolean;
  /** 入力値が変わったときに親へ通知するコールバック */
  onChange: (value: string) => void;
  /** フォーム送信時に親へ通知するコールバック、preventDefault はコンポーネント側で処理する想定 */
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
};

/**
 * 通話窓下部のメッセージ入力欄
 * テキスト入力と送信ボタンを 1 行に並べ、500 文字を上限にする
 */
export const Composer = ({ text, canSubmit, onChange, onSubmit }: Composer) => (
  <form
    onSubmit={onSubmit}
    className="flex items-center gap-2 border-rule/70 border-t bg-paper/80 px-4 py-3"
  >
    <Input
      value={text}
      onChange={(event) => onChange(event.target.value)}
      placeholder="いま、話そう"
      maxLength={500}
      className="h-9 flex-1 border-rule bg-paper font-sans text-[14px] text-ink"
    />
    <button
      type="submit"
      disabled={!canSubmit}
      aria-label="送る"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-lamp text-paper transition-opacity hover:opacity-90 disabled:opacity-30"
    >
      <Send className="size-4" />
    </button>
  </form>
);
