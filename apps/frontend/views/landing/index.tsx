"use client";

import { Backdrop } from "@/components/backdrop";
import { Shell } from "@/components/shell";
import { Create } from "./create";
import { Join } from "./join";
import { Tabs } from "./tabs";
import { useLanding } from "./use-landing";

/**
 * トップページのランディング画面
 * タブで `Create` と `Join` を切り替えつつ、共通の Shell レイアウトにフォームを載せる
 */
export const Landing = () => {
  const landing = useLanding();

  return (
    <Backdrop>
      <Shell headline="今日も、なんとなく一緒に" lede="リモートだけど、リモートじゃない">
        <div className="flex flex-col gap-6 rounded-xl border border-rule bg-paper/80 p-7 shadow-[0_1px_0_var(--rule),0_20px_40px_-24px_oklch(from_var(--ink)_l_c_h/0.18)] backdrop-blur-sm md:p-8">
          <Tabs tab={landing.tab} onTab={landing.onTab} />
          {landing.tab === "create" ? <Create /> : <Join />}
        </div>
      </Shell>
    </Backdrop>
  );
};
