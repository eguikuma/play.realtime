import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoUnavailable } from "../../../domain/bgm";

@Catch(UndoUnavailable)
export class UndoUnavailableFilter implements ExceptionFilter {
  catch(exception: UndoUnavailable, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(409).json({
      code: "UndoUnavailable",
      message: exception.message,
    });
  }
}
