import Link from "next/link";
import { Backdrop, Notice } from "@/features/room/layout";

/**
 * どのルートにも一致しないアクセスを受けたときに表示する 404 画面
 * トップへの動線だけを残し、URL のミスタイプや古いリンクからの訪問者を新しい部屋作成経路へ誘導する
 */
export default function NotFound() {
  return (
    <Backdrop>
      <Notice headline="見当たりませんでした" lede="このページはたどり着けないようです">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 font-sans text-primary-foreground text-sm transition-colors hover:bg-primary/80"
        >
          トップへ戻る
        </Link>
        <p className="font-sans text-[12px] text-ink-mute leading-relaxed [word-break:auto-phrase]">
          URL をもう一度確かめるか、トップから入り直してみてください
        </p>
      </Notice>
    </Backdrop>
  );
}
