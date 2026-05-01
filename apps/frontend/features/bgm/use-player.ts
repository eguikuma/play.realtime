"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 音量と停止状態を永続化する `localStorage` キー群
 * キー名はプロダクト固有の接頭辞を付けて、同一ドメインに同居する他アプリとの衝突を避ける
 */
const VOLUME_STORAGE_KEY = "rimodoki:bgm:volume";

const PAUSED_STORAGE_KEY = "rimodoki:bgm:paused";

/**
 * 音量スライダーの初期値、0 〜 100 のスケール、控えめな 5 を選ぶ
 */
const DEFAULT_VOLUME = 5;

/**
 * `<audio>` 要素への `ref` と操作関数を組み立てるフック
 * 音量と停止状態は `localStorage` に永続化し、リロードやタブ再訪での一貫性を保つ
 * 自動再生の失敗はブラウザ側のユーザー操作要件によるもので、`paused = true` を永続化して UI 側の再生ボタンから明示再開を促す
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
