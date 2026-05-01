import * as z from "zod";

export const origin = z.url().parse(process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:4000");

export const wsOrigin = origin.replace(/^http/, "ws");
