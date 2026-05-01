import "reflect-metadata";
import { existsSync } from "node:fs";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { load } from "./environment";

/**
 * `.env` が存在すれば Node 標準の `loadEnvFile` で取り込む
 * dotenv ライブラリを足さない前提で、本番コンテナは環境変数、ローカル開発は `.env` を置く構成を両立する
 */
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

/**
 * サーバ起動エントリポイント
 * 環境変数検証 NestApplication 生成 cookie-parser 適用 CORS 許可 シャットダウンフック有効化 リッスン開始の順で組み立てる
 */
const main = async (): Promise<void> => {
  const environment = load();
  const application = await NestFactory.create(AppModule);

  application.use(cookieParser());
  application.enableCors({
    origin: environment.WEB_ORIGIN,
    credentials: true,
  });
  application.enableShutdownHooks();

  await application.listen(environment.PORT);
  Logger.log(`listening on http://localhost:${environment.PORT}`, "Bootstrap");
};

main().catch((error) => {
  Logger.error(error, "Bootstrap");
  process.exit(1);
});
