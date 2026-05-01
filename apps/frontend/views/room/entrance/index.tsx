"use client";

import type { RoomId } from "@play.realtime/contracts";
import { Backdrop } from "@/components/backdrop";
import { Label } from "@/components/label";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntrance } from "./use-entrance";

type Entrance = {
  /** 入室対象のルーム ID、参加 API の送信先に使う */
  roomId: RoomId;
};

/**
 * URL 経由でやってきた未入室ユーザの入室フォーム画面
 * 名前を入力して送信するだけで `useSession` にメンバー情報を書き込み、画面を入室済みに切り替える
 */
export const Entrance = ({ roomId }: Entrance) => {
  const entrance = useEntrance(roomId);

  return (
    <Backdrop>
      <Shell headline="そっと、合流しよう" lede="ひとりだけど、ひとりじゃない">
        <form
          onSubmit={entrance.onSubmit}
          className="flex flex-col gap-5 rounded-xl border border-rule bg-paper/80 p-7 shadow-[0_1px_0_var(--rule),0_20px_40px_-24px_oklch(from_var(--ink)_l_c_h/0.18)] backdrop-blur-sm md:p-8"
        >
          <label htmlFor="member-name" className="flex flex-col gap-2">
            <Label>あなたの名前</Label>
            <Input
              id="member-name"
              value={entrance.name}
              onChange={(event) => entrance.onChange(event.target.value)}
              placeholder="ゆみ"
              maxLength={24}
              autoFocus
              className="h-11 rounded-md border-rule bg-paper font-sans text-base text-ink placeholder:text-ink-mute/60"
            />
          </label>
          <Button
            type="submit"
            size="lg"
            disabled={!entrance.canSubmit}
            className="h-11 rounded-md font-sans text-sm"
          >
            そっと入室する
          </Button>
        </form>
      </Shell>
    </Backdrop>
  );
};
