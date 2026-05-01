"use client";

import { Label } from "@/components/label";
import { Button } from "@/libraries/ui/button";
import { Input } from "@/libraries/ui/input";
import { useCreate } from "./use-create";

/**
 * ランディングの Create タブで使うホスト名入力フォーム
 * 名前を入力して送信するとルームが作られ、発行された URL を共有することで他のメンバーが参加できるようになる
 */
export const Create = () => {
  const create = useCreate();

  return (
    <form onSubmit={create.onSubmit} className="flex flex-col gap-5">
      <label htmlFor="host-name" className="flex flex-col gap-2">
        <Label>あなたの名前</Label>
        <Input
          id="host-name"
          value={create.hostName}
          onChange={(event) => create.onChange(event.target.value)}
          placeholder="たかし"
          maxLength={24}
          autoFocus
          className="h-11 rounded-md border-rule bg-paper font-sans text-base text-ink placeholder:text-ink-mute/60"
        />
      </label>
      <Button
        type="submit"
        size="lg"
        disabled={!create.canSubmit}
        className="h-11 rounded-md font-sans text-sm"
      >
        部屋をつくる
      </Button>
      <p className="font-sans text-[12px] text-ink-mute leading-relaxed [word-break:auto-phrase]">
        作成するとリンクが発行されます
        <br />
        それをチームに渡すだけで、相手はそのまま入室できます
      </p>
    </form>
  );
};
