"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 音量を localStorage に保存する際の鍵
 */
const VOLUME_STORAGE_KEY = "rimodoki:bgm:volume";

/**
 * 一時停止状態を localStorage に保存する際の鍵
 * リロード直後も直前の停止意思をそのまま復元し 描画初回の再生中っぽい表示を防ぐ
 */
const PAUSED_STORAGE_KEY = "rimodoki:bgm:paused";

/**
 * 参加直後の驚きを避けるための初期音量
 */
const DEFAULT_VOLUME = 5;

/**
 * HTML の audio 要素の再生と音量を宣言的に扱うフック
 * 音源と一時停止の 2 軸から再生と停止を制御し 曲ごとの音量係数を利用者の音量値に掛ける
 * 一時停止の意思と音量はブラウザ単位で localStorage に保存し 再入室やリロード越しに復元する
 */
export const usePlayer = (src: string | null, gain: number) => {
  const ref = useRef<HTMLAudioElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [paused, setPausedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PAUSED_STORAGE_KEY) === "true";
  });
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_VOLUME;
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : DEFAULT_VOLUME;
  });

  const persistPaused = useCallback((next: boolean) => {
    setPausedState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PAUSED_STORAGE_KEY, String(next));
    }
  }, []);

  useEffect(() => {
    if (ref.current) {
      ref.current.volume = (volume / 100) * gain;
    }
  }, [volume, gain]);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;

    if (!src || paused) {
      audio.pause();
      setLoading(false);
      return;
    }

    setLoading(true);
    audio.play().catch(() => {
      persistPaused(true);
      setLoading(false);
    });
  }, [src, paused, persistPaused]);

  const setVolume = useCallback(
    (value: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(value)));
      setVolumeState(clamped);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
      }
      if (ref.current) {
        ref.current.volume = (clamped / 100) * gain;
      }
    },
    [gain],
  );

  const play = useCallback(() => {
    persistPaused(false);
  }, [persistPaused]);

  const pause = useCallback(() => {
    persistPaused(true);
  }, [persistPaused]);

  const handlers = {
    onPlaying: () => setLoading(false),
    onCanPlay: () => setLoading(false),
    onWaiting: () => setLoading(true),
    onError: () => {
      setLoading(false);
      persistPaused(true);
    },
  };

  return { ref, paused, loading, volume, setVolume, play, pause, handlers };
};
