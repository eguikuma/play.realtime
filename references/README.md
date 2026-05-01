## 目次

1. [01 通信方式の使い分け判断軸](./01-communication-pattern.md)（SSE と WebSocket と Polling の選択）
2. [02 サーバ進化と fanout](./02-server-evolution-and-fanout.md)（単一サーバから Redis pubsub への発展）
3. [03 在席判定の grace パターン](./03-presence-grace.md)（切断と再接続の境目）
4. [04 多 instance dispatch の決定論性](./04-dispatch-determinism.md)（1 instance だけが fire を担当する仕組み）
5. [05 退室シグナル経路の重ね合わせ](./05-leave-signal-paths.md)（3 経路の協調で全閉じを集約）
6. [06 多 instance での接続数集計](./06-connection-counting.md)（atomic counter の活用）
7. [07 双方向状態同期](./07-bidirectional-state.md)（WS が必要な機能の状態管理）
