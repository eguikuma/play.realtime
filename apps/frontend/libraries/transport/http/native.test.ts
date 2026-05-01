import { beforeEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { HttpFailure } from "./errors";
import { createNativeHttpClient } from "./native";

describe("createNativeHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("`GET` 成功時にレスポンスを `Zod` で検証して返す", async () => {
    const shape = z.object({ name: z.string() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ name: "alice" }), { status: 200 })),
    );

    const http = createNativeHttpClient({ origin: "http://api.test" });
    const result = await http.get({ endpoint: "/users/1", response: shape });

    expect(result).toEqual({ name: "alice" });
  });

  it("レスポンスが `Zod` 検証に失敗すると HttpFailure を投げる", async () => {
    const shape = z.object({ name: z.string() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ name: 123 }), { status: 200 })),
    );

    const http = createNativeHttpClient({ origin: "http://api.test" });

    await expect(http.get({ endpoint: "/users/1", response: shape })).rejects.toBeInstanceOf(
      HttpFailure,
    );
  });

  it("HTTP ステータスが `2xx` 以外のとき HttpFailure を投げる", async () => {
    const shape = z.object({});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );

    const http = createNativeHttpClient({ origin: "http://api.test" });

    await expect(http.get({ endpoint: "/missing", response: shape })).rejects.toBeInstanceOf(
      HttpFailure,
    );
  });

  it("`POST` では `body` を JSON 化して送信する", async () => {
    const requestShape = z.object({ title: z.string() });
    const responseShape = z.object({ id: z.number() });
    const mock = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    vi.stubGlobal("fetch", mock);

    const http = createNativeHttpClient({ origin: "http://api.test" });
    const result = await http.post({
      endpoint: "/items",
      body: { title: "hello" },
      request: requestShape,
      response: responseShape,
    });

    expect(result).toEqual({ id: 1 });
    expect(mock).toHaveBeenCalledWith(
      "http://api.test/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "hello" }),
      }),
    );
  });

  it("cookie 送信のため `credentials` を `include` で常時付与する", async () => {
    const mock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mock);

    const http = createNativeHttpClient({ origin: "http://api.test" });
    await http.get({ endpoint: "/echo", response: z.unknown() });

    expect(mock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("`DELETE` は `204` でも例外にせず完了する", async () => {
    const mock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", mock);

    const http = createNativeHttpClient({ origin: "http://api.test" });
    await expect(http.delete({ endpoint: "/items/1" })).resolves.toBeUndefined();
    expect(mock).toHaveBeenCalledWith(
      "http://api.test/items/1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });

  it("`DELETE` で `2xx` 以外なら HttpFailure を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );

    const http = createNativeHttpClient({ origin: "http://api.test" });

    await expect(http.delete({ endpoint: "/items/1" })).rejects.toBeInstanceOf(HttpFailure);
  });
});
