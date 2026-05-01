import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type * as z from "zod";

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: "ValidationError",
        issues: result.error.issues,
      });
    }
    return result.data;
  }
}
