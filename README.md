# play.realtime

## 概要

SSE と WebSocket を使った Web アプリケーションです。

生の EventSource・生の Response 書き込み・ws ライブラリ直接利用など、リアルタイム通信プロトコルの挙動を試しています。

## 機能

- メンバー状態のリアルタイム同期（SSE）
- BGM 共有（SSE）
- ひとこと投稿のリアルタイム配信（SSE）
- 1 対 1 の雑談マッチング（WebSocket）

## 資料

リアルタイム通信の概念と判断軸を [references/](./references/) にまとめた、推奨読み順は [references/README.md](./references/README.md) を参照
