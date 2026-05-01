"use client";

import { Send } from "lucide-react";
import type { SyntheticEvent } from "react";

import { Input } from "@/components/ui/input";

/**
 * 入力欄に渡す入力を持つ
 * 送信可否は空白除去済みの文字列が空でないかを 親側で計算した結果を使う
 */
type Composer = {
  text: string;
  canSubmit: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
};

/**
 * 通話ウィンドウ下部のメッセージ入力行
 * Enter での送信はフォーム送信を通じて行い 空の送信は送信ボタンの無効化で抑える
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
