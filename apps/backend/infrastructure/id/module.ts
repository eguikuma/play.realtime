import { Global, Module } from "@nestjs/common";
import { NanoidIdGenerator } from "./nanoid";

@Global()
@Module({
  providers: [NanoidIdGenerator],
  exports: [NanoidIdGenerator],
})
export class IdModule {}
