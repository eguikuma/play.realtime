import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type * as z from "zod";

/**
 * 受信した値を Zod スキーマで検証し 解析済みの値を下流へ渡す NestJS の Pipe
 * 検証に失敗したら `BadRequestException` を投げ 詳細として issues を返す
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  /**
   * 検証に使う Zod スキーマを 依存性注入ではなくコンストラクタ引数として直接受け取る
   */
  constructor(private readonly schema: z.ZodType<T>) {}

  /**
   * スキーマで安全解析し 成功なら解析済みデータを返し 失敗なら 400 を投げる
   */
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
