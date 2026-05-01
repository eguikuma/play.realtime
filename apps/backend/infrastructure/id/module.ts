import { Global, Module } from "@nestjs/common";
import { NanoidIdGenerator } from "./nanoid";

/**
 * `NanoidIdGenerator` を全機能で共有できるようにする グローバルな NestJS モジュール
 */
@Global()
@Module({
  providers: [NanoidIdGenerator],
  exports: [NanoidIdGenerator],
})
export class IdModule {}
