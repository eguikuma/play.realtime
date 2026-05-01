import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type * as z from "zod";

/**
 * Zod スキーマで HTTP 入力を検証する汎用 Pipe
 * 失敗時は `ValidationError` コードと `issues` 配列を含む 400 を投げ、クライアント側でフィールド単位の誤りを取り出せる形にする
 * `@Body`、`@Param`、`@Query` のいずれの引数にも接続でき、Controller 側には Zod 型推論後の値だけが届く
 */
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
