import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { RoomNotFound } from "../../../domain/room";

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
