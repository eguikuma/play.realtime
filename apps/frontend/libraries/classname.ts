import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を条件付きで合成しつつ、Tailwind の競合ユーティリティを後勝ちで解決するヘルパ
 * shadcn/ui の慣習に合わせて `cn` の 1 語だけを公開し、プロダクトコード全域で利用する
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
