# War Simulation Game

[![Deploy](https://img.shields.io/badge/Play-war--sim--game.pages.dev-blue)](https://war-sim-game.pages.dev)

ターン制の戦争シミュレーションゲーム。2人のプレイヤーがグリッド上で軍事ユニットを操作し、相手の全ユニットを撃破すると勝利。

**デプロイ先**: https://war-sim-game.pages.dev

## ゲーム内容

- **ターン制対戦**: プレイヤー1（Hero）とプレイヤー2（Villain）が交互にターンを進行
- **3種のユニット**: 戦闘機（fighter）、戦車（tank）、兵士（soldier）がそれぞれ異なる性能・武装を持つ
- **移動と攻撃**: 各ユニットはターン中に移動と攻撃を1回ずつ実行可能
- **勝利条件**: 相手プレイヤーの全ユニットを撃破後、「確定」で勝利判定

### ユニット特性

| ユニット | HP | EN | 移動力 | 武装例 |
|---------|-----|-----|-------|--------|
| 戦闘機 | 800-1000 | 200 | 2-4 | Machine gun, Missile |
| 戦車 | 2000 | 400 | 2 | Machine gun, Cannon |
| 兵士 | 200 | 100 | 1 | Assault rifle, Grenade launcher, Suicide drone |

## シナリオ

従来のtutorialに加え、「はじめの射程」「混成小隊」「森の交差点」の短編3本を選べます。新規対戦は同じ端末でのローカル2人交代です。勝敗表示から同じ面で再戦するか、選択画面へ戻って別の面を開始できます。既存のCPU対戦セーブは元のモードで再開できます。

詳細な操作・ローカル試用手順・検証画像・勝利traceは[実行記録](docs/runs/three-scenarios/README.md)を参照してください。

## セットアップ

```bash
yarn install
yarn dev
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `yarn dev` | 開発サーバー起動 |
| `yarn build` | 型チェック + プロダクションビルド |
| `yarn lint` | ESLint 実行（警告ゼロポリシー） |
| `yarn test` | テスト実行（Vitest） |
| `yarn test:watch` | テストのウォッチモード |

## 技術スタック

- **React 18** + **TypeScript**（strict mode）
- **Vite** — ビルド・開発サーバー
- **Vitest** + **React Testing Library** — テスト
- **Sass** — スタイリング
- **vite-plugin-svgr** — SVG を React コンポーネントとして使用

## プロジェクト構成

```
src/
├── game/
│   ├── gameReducer.ts    # ゲームロジック（純粋関数、React非依存）
│   └── types.ts          # GameState, GamePhase, GameAction
├── pages/Stage/
│   ├── index.tsx          # メインステージ（2つのreducerを統合）
│   ├── logics.ts          # UI reducer（メニュー状態管理）
│   ├── Cell.tsx           # セル描画の振り分け
│   ├── MoveModeCell.tsx   # 移動モードセル
│   ├── AttackModeCell.tsx # 攻撃モードセル
│   ├── IdleCell.tsx       # 通常セル
│   ├── ActionMenu.tsx     # アクションメニュー
│   └── CellWithUnit.tsx   # ユニット付きセル描画
├── scenarios/
│   └── tutorial.ts        # シナリオ定義（グリッド・ユニット配置）
├── constants/
│   └── index.ts           # ユニット種別ごとの武装データ
└── types/
    ├── index.ts           # 共通型定義
    └── scenario.ts        # シナリオ型
```

## 操作

- キー・マウス: ユニット・移動先・攻撃先をクリック。Tabで戦場へ入り、さらにTabで味方を選択。行動ボタンはTab/Shift+Tab/Enter、戦場では矢印でカーソル、Enterで選択・確定（カーソルなしならターン終了）、Escで閉じる。
- タッチ: ユニットと画面のメニューをタップして選択・移動・攻撃し、「確定」ボタンでターン終了（clickイベント経由）。専用のスワイプ・ピンチ操作はない。
