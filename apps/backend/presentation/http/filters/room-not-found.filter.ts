import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { RoomNotFound } from "../../../domain/room";

/**
 * Domain Error `RoomNotFound` を HTTP 404 へ変換する ExceptionFilter
 * Controller に try catch を書かずに、URL 共有先のルームが閉じていた場合の応答を横断的に揃える
 */
@Catch(RoomNotFound)
export class RoomNotFoundFilter implements ExceptionFilter {
  catch(exception: RoomNotFound, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(404).json({
      code: "RoomNotFound",
      message: exception.message,
      id: exception.id,
    });
  }
}
