import * as z from "zod";

export const Environment = z.object({
  PORT: z.coerce.number().int().positive().default(4000),

  WEB_ORIGIN: z.url().default("http://localhost:3000"),

  ROOM_GRACE_MS: z.coerce.number().int().positive().default(30_000),
});

export type Environment = z.infer<typeof Environment>;

export const load = (): Environment => Environment.parse(process.env);
