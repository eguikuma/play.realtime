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

[<img src="./summary.drawio.svg" alt="全体俯瞰" width="100%" style="height: auto;">](./summary.drawio.svg)

[<img src="./sse-vs-ws.drawio.svg" alt="SSE と WebSocket の使い分け判断軸" width="100%" style="height: auto;">](./sse-vs-ws.drawio.svg)

[<img src="./apps/backend/summary.drawio.svg" alt="Clean Architecture 4層と5機能の構成" width="100%" style="height: auto;">](./apps/backend/summary.drawio.svg)

[<img src="./apps/backend/infrastructure/transport/sse/flow.drawio.svg" alt="SSE データフロー" width="100%" style="height: auto;">](./apps/backend/infrastructure/transport/sse/flow.drawio.svg)

[<img src="./apps/backend/infrastructure/transport/ws/flow.drawio.svg" alt="WebSocket データフロー" width="100%" style="height: auto;">](./apps/backend/infrastructure/transport/ws/flow.drawio.svg)

[<img src="./apps/backend/infrastructure/pubsub/abstraction.drawio.svg" alt="PubSub 抽象と Redis 差し替え" width="100%" style="height: auto;">](./apps/backend/infrastructure/pubsub/abstraction.drawio.svg)

[<img src="./apps/backend/application/room/lifecycle.drawio.svg" alt="ルーム生命サイクル" width="100%" style="height: auto;">](./apps/backend/application/room/lifecycle.drawio.svg)

[<img src="./apps/frontend/summary.drawio.svg" alt="App Router と features と libraries の全体像" width="100%" style="height: auto;">](./apps/frontend/summary.drawio.svg)

[<img src="./apps/frontend/libraries/transport/abstraction.drawio.svg" alt="Transport 抽象 port と native の二層" width="100%" style="height: auto;">](./apps/frontend/libraries/transport/abstraction.drawio.svg)

[<img src="./apps/frontend/libraries/transport/lifecycle.drawio.svg" alt="接続ライフサイクルと再接続戦略" width="100%" style="height: auto;">](./apps/frontend/libraries/transport/lifecycle.drawio.svg)

[<img src="./apps/frontend/libraries/connection-status/feedback.drawio.svg" alt="接続状態のフィードバック" width="100%" style="height: auto;">](./apps/frontend/libraries/connection-status/feedback.drawio.svg)

[<img src="./apps/frontend/features/structure.drawio.svg" alt="features の構造パターン" width="100%" style="height: auto;">](./apps/frontend/features/structure.drawio.svg)
