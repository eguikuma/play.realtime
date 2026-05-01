"use client";

import type { MemberId, RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";
import { BgmStrip } from "@/features/bgm";
import { HallwayOverlays, useHallway } from "@/features/hallway";
import { Compose, MurmurBody } from "@/features/murmur";
import { useVibe, VibeRow } from "@/features/vibe";
import { useSession } from "@/stores/session";
import { BrandMark } from "../layout";
import { useLeave } from "../use-leave";
import { MeBadge } from "./me-badge";

type Stage = {
  /** 描画対象のルーム ID、子コンポーネントへ渡して各機能の購読先を確定させる */
  roomId: RoomId;
};

/**
 * 入室済みルーム画面
 * 外殻をビューポート高に固定し、内部を CSS Grid 5 行で組む
 * 行 1 から 4 (header / BGM / Vibe / Compose) を auto 高、行 5 (MurmurBody) のみ `minmax(0,1fr)` で可変にして、その内側だけがスクロールする
 * これにより flex-1 の連鎖で起きていた「静的子の合計がビューポートを超えると ol が 0 px に潰れる/外に溢れる」問題を構造的に避ける
 * Hallway の招待と通話オーバーレイは fixed 配置でレイアウトと独立しており、Grid 化の影響を受けない
 * Hallway 由来の取り込み中、通話中、招待送信は composition feature の責務としてここで集計し、`VibeRow` に props で渡す
 */
export const RoomStage = ({ roomId }: Stage) => {
  const me = useSession((state) => state.me);
  const presentCount = useVibe((state) => Object.keys(state.statuses).length);
  const invitations = useHallway((state) => state.invitations);
  const calls = useHallway((state) => state.calls);
  const send = useHallway((state) => state.send);
  useLeave(roomId);

  const busyMemberIds = useMemo(() => {
    const set = new Set<MemberId>();
    for (const invitation of Object.values(invitations)) {
      set.add(invitation.fromMemberId);
      set.add(invitation.toMemberId);
    }
    for (const call of Object.values(calls)) {
      for (const id of call.memberIds) set.add(id);
    }
    return set;
  }, [invitations, calls]);

  const callingMemberIds = useMemo(() => {
    const set = new Set<MemberId>();
    for (const call of Object.values(calls)) {
      for (const id of call.memberIds) set.add(id);
    }
    return set;
  }, [calls]);

  const invite = useMemo(
    () => (send ? (memberId: MemberId) => send("Invite", { inviteeId: memberId }) : null),
    [send],
  );

  return (
    <div className="relative h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70svh] animate-lamp-drift bg-[radial-gradient(ellipse_55%_75%_at_14%_4%,oklch(from_var(--lamp)_l_c_h/0.32),transparent_62%)]"
      />
      <div className="relative mx-auto grid h-full max-w-[980px] grid-rows-[auto_auto_auto_auto_minmax(0,1fr)] gap-y-3 short:gap-y-2 px-4 pt-4 short:pt-2 pb-4 short:pb-2 md:gap-y-4 md:px-10 md:pt-6 md:pb-6">
        <header className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 font-bold font-display short:text-[20px] text-[24px] text-ink leading-none tracking-[-0.01em] md:text-[30px]">
            <BrandMark className="short:size-6 size-7 shrink-0 md:size-8" />
            りもどき
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden font-sans text-[12px] text-ink-mute sm:inline">
              {presentCount}人が部屋にいます
            </span>
            {me && <MeBadge name={me.name} />}
          </div>
        </header>

        <BgmStrip roomId={roomId} />

        <VibeRow
          roomId={roomId}
          busyMemberIds={busyMemberIds}
          callingMemberIds={callingMemberIds}
          invite={invite}
        />

        <Compose roomId={roomId} />

        <MurmurBody roomId={roomId} />
      </div>

      <HallwayOverlays roomId={roomId} />
    </div>
  );
};
