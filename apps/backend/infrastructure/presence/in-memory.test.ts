import type { RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { InMemoryRoomPresence } from "./in-memory";

const room = "room-abc-1234" as RoomId;
const other = "room-abc-zzzz" as RoomId;

describe("InMemoryRoomPresence", () => {
  it("空から初回の接続で populated を配信する", () => {
    const presence = new InMemoryRoomPresence();
    const listener = vi.fn();
    presence.onTransition(listener);

    presence.register(room);

    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "populated" });
  });

  it("同じルームの 2 本目の接続では populated を配信しない", () => {
    const presence = new InMemoryRoomPresence();
    const listener = vi.fn();
    presence.register(room);
    presence.onTransition(listener);

    presence.register(room);

    expect(listener).not.toHaveBeenCalled();
  });

  it("最終接続の切断で empty を配信する", () => {
    const presence = new InMemoryRoomPresence();
    const listener = vi.fn();
    presence.register(room);
    presence.register(room);
    presence.onTransition(listener);

    presence.deregister(room);
    expect(listener).not.toHaveBeenCalled();

    presence.deregister(room);
    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "empty" });
  });

  it("接続数 0 の状態で deregister を呼んでも例外にもイベントにもならない", () => {
    const presence = new InMemoryRoomPresence();
    const listener = vi.fn();
    presence.onTransition(listener);

    expect(() => presence.deregister(room)).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it("別ルームの接続は互いに干渉しない", async () => {
    const presence = new InMemoryRoomPresence();
    const listener = vi.fn();
    presence.onTransition(listener);

    presence.register(room);
    presence.register(other);
    presence.deregister(room);

    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "populated" });
    expect(listener).toHaveBeenCalledWith({ roomId: other, kind: "populated" });
    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "empty" });
    expect(await presence.countConnections(other)).toBe(1);
  });

  it("空になった後に再び登録すると populated を再配信する", () => {
    const presence = new InMemoryRoomPresence();
    const listener = vi.fn();
    presence.register(room);
    presence.deregister(room);
    presence.onTransition(listener);

    presence.register(room);

    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "populated" });
  });

  it("購読を解除した後はイベントが届かない", () => {
    const presence = new InMemoryRoomPresence();
    const listener = vi.fn();
    const subscription = presence.onTransition(listener);

    subscription.unsubscribe();
    presence.register(room);

    expect(listener).not.toHaveBeenCalled();
  });

  it("あるリスナーの例外が他のリスナーへの配信を止めない", () => {
    const presence = new InMemoryRoomPresence();
    const failing = vi.fn(() => {
      throw new Error("boom");
    });
    const healthy = vi.fn();
    presence.onTransition(failing);
    presence.onTransition(healthy);

    presence.register(room);

    expect(failing).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledWith({ roomId: room, kind: "populated" });
  });

  it("countConnections は現在の総接続数を返す", async () => {
    const presence = new InMemoryRoomPresence();
    presence.register(room);
    presence.register(room);
    presence.register(room);
    presence.deregister(room);

    expect(await presence.countConnections(room)).toBe(2);
  });
});
