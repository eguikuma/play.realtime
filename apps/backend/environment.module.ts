import { Global, Module } from "@nestjs/common";
import { Environment, load } from "./environment";

/**
 * 検証済み環境変数オブジェクトを `Environment` トークンで注入する Global モジュール
 * `load` を `useFactory` に通すことで Zod 検証はアプリ起動時に 1 度だけ走り、各機能モジュールの factory からは検証済みの値を直接受け取れる
 */
@Global()
@Module({
  providers: [
    {
      provide: Environment,
      useFactory: load,
    },
  ],
  exports: [Environment],
})
export class EnvironmentModule {}
