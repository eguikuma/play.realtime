import { Global, Module } from "@nestjs/common";
import { NanoidIdGenerator } from "./nanoid";

/**
 * `NanoidIdGenerator` をアプリ全体へ提供する Global モジュール
 * ID 採番は各機能 usecase が使うため、Global 指定で毎回 import する手間を省く
 */
@Global()
@Module({
  providers: [NanoidIdGenerator],
  exports: [NanoidIdGenerator],
})
export class IdModule {}
