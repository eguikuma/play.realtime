import type { TrackId } from "@play.realtime/contracts";

export type Track = {
  title: string;
  artist: string;
  src: string;
  gain: number;
};

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
