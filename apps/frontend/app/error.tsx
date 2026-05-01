"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Backdrop, Notice } from "@/features/room/layout";

export default function RouteError({ reset }: { reset: () => void }) {
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
