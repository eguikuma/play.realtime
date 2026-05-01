import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { MemberNotFound } from "../../../domain/room";

@Catch(MemberNotFound)
export class MemberNotFoundFilter implements ExceptionFilter {
  catch(exception: MemberNotFound, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(401).json({
      code: "MemberNotFound",
      message: exception.message,
      roomId: exception.roomId,
      memberId: exception.memberId,
    });
  }
}
