import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { BgmRepository } from "../../domain/bgm";
import { HallwayRepository } from "../../domain/hallway";
import { MurmurRepository } from "../../domain/murmur";
import { RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";
import { RoomLifecycle } from "./lifecycle";

/**
 * 起動時に各リポジトリの `remove` を `RoomLifecycle` のクリーンアップへ登録する
 * 登録順がそのまま閉鎖時の削除順になるため、周辺データ (vibe / bgm / murmur / hallway) を先に消してから最後にルーム本体を消す並びにしている
 */
@Injectable()
export class RoomCleanupRegistrar implements OnModuleInit {
  constructor(
    private readonly lifecycle: RoomLifecycle,
    @Inject(VibeRepository) private readonly vibe: VibeRepository,
    @Inject(BgmRepository) private readonly bgm: BgmRepository,
    @Inject(MurmurRepository) private readonly murmur: MurmurRepository,
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    @Inject(RoomRepository) private readonly room: RoomRepository,
  ) {}

  onModuleInit(): void {
    this.lifecycle.registerCleanup((roomId: RoomId) => this.vibe.remove(roomId));
    this.lifecycle.registerCleanup((roomId: RoomId) => this.bgm.remove(roomId));
    this.lifecycle.registerCleanup((roomId: RoomId) => this.murmur.remove(roomId));
    this.lifecycle.registerCleanup((roomId: RoomId) => this.hallway.remove(roomId));
    this.lifecycle.registerCleanup((roomId: RoomId) => this.room.remove(roomId));
  }
}
