import type { MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { InviterBusy } from "../../domain/hallway/errors";
import type { WsConnection } from "../../infrastructure/transport/ws";
import { dispatchHallwayCommand, type HallwayCommandHandlers } from "./hallway-dispatch";

const roomId = "room-abc-1234" as RoomId;
const memberId = "m-1" as MemberId;
const inviteeId = "m-2" as MemberId;

const buildConnection = (): WsConnection =>
  ({
    send: vi.fn(),
  }) as unknown as WsConnection;

const buildLogger = () => ({
  debug: vi.fn(),
  warn: vi.fn(),
});

const buildHandlers = (overrides: Partial<HallwayCommandHandlers> = {}): HallwayCommandHandlers => {
  const noop = vi.fn(async () => {});
  return {
    Invite: noop,
    Accept: noop,
    Decline: noop,
    Cancel: noop,
    Send: noop,
    Leave: noop,
    ...overrides,
  };
};

describe("dispatchHallwayCommand", () => {
  it("未知の命令名を受け取ると debug ログに流して CommandFailed は送らない", async () => {
    const connection = buildConnection();
    const logger = buildLogger();
    await dispatchHallwayCommand({
      connection,
      envelope: { name: "Unknown", data: {} },
      context: { roomId, memberId },
      handlers: buildHandlers(),
      logger,
    });

    expect(logger.debug).toHaveBeenCalledWith("unknown message Unknown");
    expect(logger.warn).not.toHaveBeenCalled();
    expect(connection.send).not.toHaveBeenCalled();
  });

  it("ハンドラがドメイン例外を投げると操作本人の接続だけへ CommandFailed を直送する", async () => {
    const connection = buildConnection();
    const logger = buildLogger();
    const handlers = buildHandlers({
      Invite: vi.fn(async () => {
        throw new InviterBusy(memberId);
      }),
    });
    await dispatchHallwayCommand({
      connection,
      envelope: { name: "Invite", data: { inviteeId } },
      context: { roomId, memberId },
      handlers,
      logger,
    });

    expect(connection.send).toHaveBeenCalledTimes(1);
    expect(connection.send).toHaveBeenCalledWith("CommandFailed", {
      code: "InviterBusy",
      command: "Invite",
      message: expect.any(String),
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("ハンドラが非ドメイン例外を投げると CommandFailed は送らず警告ログに流す", async () => {
    const connection = buildConnection();
    const logger = buildLogger();
    const handlers = buildHandlers({
      Invite: vi.fn(async () => {
        throw new Error("想定外の実装不具合");
      }),
    });
    await dispatchHallwayCommand({
      connection,
      envelope: { name: "Invite", data: { inviteeId } },
      context: { roomId, memberId },
      handlers,
      logger,
    });

    expect(connection.send).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("dispatch Invite failed"));
  });

  it("Zod スキーマに反する不正なペイロードも非ドメイン例外として警告ログに流す", async () => {
    const connection = buildConnection();
    const logger = buildLogger();
    await dispatchHallwayCommand({
      connection,
      envelope: { name: "Invite", data: { inviteeId: "" } },
      context: { roomId, memberId },
      handlers: buildHandlers(),
      logger,
    });

    expect(connection.send).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("dispatch Invite failed"));
  });
});
