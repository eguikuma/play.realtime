import { cn } from "@/libraries/classname";

type Dot = {
  /** サイズや配置 (`size-1` `size-1.5` `inline-flex` `shrink-0` 等) を呼び出し側から指定する */
  className?: string;
};

/**
 * 脈打つランプ色の小さなドット
 * 通話中・話してる・呼び出し中などのオンライン状態を視覚的に示すための装飾要素
 * `aria-hidden` で装飾扱いに固定し、サイズや配置は呼び出し側の className で決める
 */
export const Dot = ({ className }: Dot) => (
  <span aria-hidden className={cn("animate-pulse-dot rounded-full bg-lamp", className)} />
);
