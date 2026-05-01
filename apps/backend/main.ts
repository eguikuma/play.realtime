import "reflect-metadata";
import { existsSync } from "node:fs";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { load } from "./environment";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

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
