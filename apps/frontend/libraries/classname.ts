import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn/ui の慣習に沿った className 組み立てヘルパー
 * clsx で条件付きの結合を行い tailwind-merge で Tailwind のユーティリティの衝突を解決する
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
