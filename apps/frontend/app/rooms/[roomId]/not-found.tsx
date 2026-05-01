import Link from "next/link";

import { Backdrop, Notice } from "@/features/room/layout";

export default function RoomNotFound() {
  return (
    <Backdrop>
      <Notice
        headline="この部屋には入れません"
        lede="閉じられた部屋か、リンクが間違っているかもしれません"
      >
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 font-sans text-primary-foreground text-sm transition-colors hover:bg-primary/80"
        >
          トップへ戻る
        </Link>
        <p className="font-sans text-[12px] text-ink-mute leading-relaxed [word-break:auto-phrase]">
          もう一度集まりたいときは、トップから新しい部屋をつくってリンクをチームに渡してください
        </p>
      </Notice>
    </Backdrop>
  );
}
