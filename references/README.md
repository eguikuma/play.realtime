# りもどき リアルタイム通信パターン集

このディレクトリは、りもどきの実装で使われているリアルタイム通信の概念と判断軸を、ファイル名やクラス名や関数名といった固有名に依存しない形で記述する
登場する語は ドメイン語 と プロトコル語 のどちらかに限定する

ドメイン語 — Vibe、Hallway、在席、招待、ルーム
プロトコル語 — TTL key、keyspace notification、pubsub、pagehide、atomic counter、HINCRBY

## 推奨読み順

1. [01 通信方式の使い分け判断軸](./01-communication-pattern.md) — SSE と WebSocket と Polling の選択
2. [02 サーバ進化と fanout](./02-server-evolution-and-fanout.md) — 単一サーバから Redis pubsub への発展
3. [03 在席判定の grace パターン](./03-presence-grace.md) — 切断と再接続の境目
4. [04 多 instance dispatch の決定論性](./04-dispatch-determinism.md) — 1 instance だけが fire を担当する仕組み
5. [05 退室シグナル経路の重ね合わせ](./05-leave-signal-paths.md) — 3 経路の協調で全閉じを集約
6. [06 多 instance での接続数集計](./06-connection-counting.md) — atomic counter の活用
7. [07 双方向状態同期](./07-bidirectional-state.md) — WS が必要な機能の状態管理

## このドキュメントが意図的に含めないもの

- ファイル名やファイルパス
- クラス名や関数名
- ライブラリ API の呼び出し例
- パフォーマンス bench の数値
- 認証やバリデーション等のリアルタイム以外の関心事

固有名を避けるのは、リネームや構造整理のたびに資料が腐ることを防ぐため
本ディレクトリでは「何のために、どんな仕組みで、どう使い分けるか」という抽象度に揃え、コードの該当箇所への踏み込みは各図末尾の「実装の踏み込み先」でドメイン名と階層名のみに留める

## 用語の表記方針

ドメイン語は機能名としてそのまま使う、プロトコル語は半角アルファベットそのまま使う
本文では 半角コロン や 半角括弧 や 半角スラッシュ を避け、em dash と読点と改行と助詞で繋ぐ
mermaid コードブロック内のラベルは構文都合で半角コロンや括弧を使う場合がある、これは構文制約の例外として扱う
