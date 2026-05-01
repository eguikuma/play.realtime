"use client";

import { Label } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJoin } from "./use-join";

/**
 * ランディングの Join タブで使うルーム ID 入力フォーム
 * ルーム ID を直接入力して参加できる、URL 共有が届かなかった場合のフォールバック経路として用意する
 */
export const Join = () => {
  const join = useJoin();

  return (
    <form onSubmit={join.onSubmit} className="flex flex-col gap-5">
      <label htmlFor="join-room-id" className="flex flex-col gap-2">
        <Label>ルーム ID</Label>
        <Input
          id="join-room-id"
          value={join.roomId}
          onChange={(event) => join.onChange(event.target.value)}
          placeholder="abc123xyz-…"
          autoFocus
          className="h-11 rounded-md border-rule bg-paper font-mono text-base text-ink placeholder:text-ink-mute/60"
        />
      </label>
      <Button type="submit" size="lg" className="h-11 rounded-md font-sans text-sm">
        その部屋へ入る
      </Button>
      <p className="font-sans text-[12px] text-ink-mute leading-relaxed [word-break:auto-phrase]">
        URL を直接開くのが一番早いですが、ID だけでも入室できます
      </p>
    </form>
  );
};
