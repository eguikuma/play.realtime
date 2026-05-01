import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoBySelf } from "../../../domain/bgm";

@Catch(UndoBySelf)
export class UndoBySelfFilter implements ExceptionFilter {
  catch(exception: UndoBySelf, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(403).json({
      code: "UndoBySelf",
      message: exception.message,
      memberId: exception.memberId,
    });
  }
}
