import { Global, Module } from "@nestjs/common";
import { PubSub } from "../../application/ports/pubsub";
import { InMemoryPubSub } from "./in-memory";

@Global()
@Module({
  providers: [
    {
      provide: PubSub,
      useClass: InMemoryPubSub,
    },
  ],
  exports: [PubSub],
})
export class PubSubModule {}
