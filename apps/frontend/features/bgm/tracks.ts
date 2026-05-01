import type { TrackId } from "@play.realtime/contracts";

/**
 * UI 表示と音声再生で使う 1 曲ぶんのメタ情報
 * 音量係数は曲ごとの元音源の音量差を吸収する倍率であり 利用者の音量値と合成する
 */
export type Track = {
  title: string;
  artist: string;
  src: string;
  gain: number;
};

/**
 * 楽曲識別子に対応する楽曲メタ情報の完全表
 * `satisfies Record` でキー集合と 1 対 1 で一致していることを型で強制する
 */
export const Tracks = {
  Blues: {
    title: "ブルースバラード",
    artist: "Alec Koff",
    src: "/bgms/Blues.mp3",
    gain: 0.5,
  },
  DanceNight: {
    title: "夜のダンス",
    artist: "Alex Zavesa",
    src: "/bgms/DanceNight.mp3",
    gain: 0.5,
  },
  Dramatic: {
    title: "ドラマティック",
    artist: "ArtMyLife",
    src: "/bgms/Dramatic.mp3",
    gain: 0.5,
  },
  DrumStomp: {
    title: "ドラムストンプ",
    artist: "EnergySound",
    src: "/bgms/DrumStomp.mp3",
    gain: 0.5,
  },
  BassGroove: {
    title: "ベースグルーヴ",
    artist: "Giorgio Vitte",
    src: "/bgms/BassGroove.mp3",
    gain: 0.5,
  },
  FunkWalk: {
    title: "ファンクウォーク",
    artist: "LightBeatsMusic",
    src: "/bgms/FunkWalk.mp3",
    gain: 0.5,
  },
  ActionRock: {
    title: "アクションロック",
    artist: "LightStockMusic",
    src: "/bgms/ActionRock.mp3",
    gain: 0.5,
  },
  PromoRock: {
    title: "プロモロック",
    artist: "MagpieMusic",
    src: "/bgms/PromoRock.mp3",
    gain: 0.5,
  },
  Hype: {
    title: "昂揚",
    artist: "MiroMaxMusic",
    src: "/bgms/Hype.mp3",
    gain: 0.5,
  },
  Comedy: {
    title: "コメディ",
    artist: "Starostin",
    src: "/bgms/Comedy.mp3",
    gain: 0.5,
  },
} as const satisfies Record<TrackId, Track>;
