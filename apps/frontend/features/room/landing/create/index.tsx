"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "../../layout";
import { useCreate } from "./use-create";

/**
 * ランディングの作成タブ本体
 * ホスト名だけを取ってルームを発行し 案内文を添えて使い方を自明にする
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
      {create.error != null && (
        <p className="font-sans text-[12px] text-ember">部屋をつくれませんでした</p>
      )}
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
