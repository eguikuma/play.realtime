"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Backdrop, Notice } from "@/features/room/layout";

/**
 * アプリ内で拾いきれなかった例外の最終受け皿となるエラーページ
 * 中央 1 列のお知らせレイアウトで 再試行と トップへ戻る 2 つの導線を縦積みにする
 */
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Backdrop>
      <Notice headline="うまくいきませんでした" lede="通信の途中で、想定外の状態になったようです">
        <Button
          type="button"
          size="lg"
          onClick={reset}
          className="h-11 rounded-md font-sans text-sm"
        >
          もう一度試す
        </Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-rule bg-paper px-4 font-sans text-ink text-sm transition-colors hover:bg-muted"
        >
          トップへ戻る
        </Link>
        <p className="font-sans text-[12px] text-ink-mute leading-relaxed [word-break:auto-phrase]">
          時間を置いて試すと、戻れることがあります
        </p>
      </Notice>
    </Backdrop>
  );
}
