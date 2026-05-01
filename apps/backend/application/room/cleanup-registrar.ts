import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { BgmRepository } from "../../domain/bgm";
import { HallwayRepository } from "../../domain/hallway";
import { MurmurRepository } from "../../domain/murmur";
import { RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";
import { RoomLifecycle } from "./lifecycle";

/**
 * ルーム配下の全 Repository を生命サイクルの後片付け関数として一括登録する起動時登録役
 * 登録順が Room 本体を最後にする意味を持つため ここで Vibe BGM ひとこと 廊下 ルーム の順に固定する
 * 各機能モジュールから分散して登録しても同じ結果になるが ひとつに束ねることで順序と意図が読み取りやすくなる
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
