import type { z } from "zod";

export type HttpClient = {
  get<TResponse>(parameters: { path: string; response: z.ZodType<TResponse> }): Promise<TResponse>;
  post<TRequest, TResponse>(parameters: {
    path: string;
    body: TRequest;
    request?: z.ZodType<TRequest>;
    response: z.ZodType<TResponse>;
  }): Promise<TResponse>;
  delete(parameters: { path: string }): Promise<void>;
};
