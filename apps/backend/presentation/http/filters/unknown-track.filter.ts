import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UnknownTrack } from "../../../domain/bgm";

@Catch(UnknownTrack)
export class UnknownTrackFilter implements ExceptionFilter {
  catch(exception: UnknownTrack, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(400).json({
      code: "UnknownTrack",
      message: exception.message,
      trackId: exception.trackId,
    });
  }
}
