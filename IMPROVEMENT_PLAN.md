# war-sim-game 改善計画

最終更新: 2026-02-19

## 現状評価

### 強み（維持すべき）
- TypeScript strict mode + 純粋関数ベースの reducer
- テスト76件が全パス（Vitest）、49件のゲームロジックテスト含む
- 依存ライブラリ最小限（本番4、開発9）
- 一方向データフロー（useReducer + Context）
- ロジックとUIの明確な分離（gameReducer.ts + logics.ts の Two-Reducer パターン）
- 近未来作戦端末テーマ（グラスモーフィズム + シアングロー）で統一されたUI
- AI対戦機能・リプレイシステム実装済み
- 地形システム（平地/森林/山岳/水域）による戦術的深み

### 総合グレード
- コード品質: A（strict types, 76 tests, lint passing, SCSS統一）
- アーキテクチャ: A-（Two-Reducer分離, シナリオ型定義, Cell分割, ScenarioContext）
- 完成度: B+（コア動作、勝敗判定、AI、リプレイ完備）
- パフォーマンス: B（React.memo 適用済み、基本最適化完了）

---

## 完了済み項目

### Phase 1: アーキテクチャ基盤 — 全完了

| # | 項目 | 完了PR | 概要 |
|---|------|--------|------|
| 1.1 | ゲーム/UIステート分離 | — | `gameReducer.ts` (純粋ゲームロジック) + `logics.ts` (UI状態) の Two-Reducer パターン |
| 1.2 | GamePhase 導入 | — | `{ type: "playing" } \| { type: "finished"; winner: number }` で勝敗管理 |
| 1.3 | UnitCategory union型化 | — | `"fighter" \| "tank" \| "soldier"` による型安全な分岐 |
| 1.4 | シナリオデータ外出し | — | `src/scenarios/tutorial.ts` + `Scenario` 型定義 |

### Phase 2: コンポーネント設計改善 — 全完了

| # | 項目 | 完了PR | 概要 |
|---|------|--------|------|
| 2.1 | Cell.tsx 責務分割 | — | `IdleCell`, `MoveModeCell`, `AttackModeCell` に分離 |
| 2.2 | ActionMenu 分離 | — | `ActionButtons.tsx` として独立ファイルに抽出 |
| 2.3 | パフォーマンス最適化 | — | `React.memo` on Cell, `useMemo` for unitsCoordinates |

### Phase 3: 開発インフラ — ほぼ完了

| # | 項目 | 完了PR | 概要 |
|---|------|--------|------|
| 3.1 | CI/CD 構築 | — | GitHub Actions で lint → build → test を自動実行 |
| 3.2 | コンポーネントテスト | — | Stage.test.tsx (4件), StageWin.test.tsx (1件) 追加。76件全テストパス |
| 3.3 | SVG アセット最適化 | PR #16 | AI生成JPG画像に置き換え。SVG 205KB問題を解消 |

### Phase 4: ゲーム完成度 — ほぼ完了

| # | 項目 | 完了PR | 概要 |
|---|------|--------|------|
| 4.1 | 勝敗判定 + リスタート | — | GamePhase + GameOverOverlay でフル実装 |
| 4.3 | 残存 TODO の解消 | — | Cell.tsx の TODO コメント全て解消済み |

### Phase 5: UX 向上 — 大半完了

| # | 項目 | 完了PR | 概要 |
|---|------|--------|------|
| — | 移動アニメーション | PR #15 | AnimationLayer によるスムーズな移動遷移 |
| — | 攻撃エフェクト | PR #15 | ダメージ数値表示、攻撃フラッシュ |
| — | ダメージプレビュー | PR #17 | 攻撃モードでホバー時に予測ダメージ・地形防御表示 |
| — | 地形ツールチップ | PR #17 | セルホバーで地形名・防御率・移動コスト表示 |
| — | ターンカウンター | PR #17 | TurnBanner に "TURN N" 表示 |

### Phase 6: 機能拡張 — 一部完了

| # | 項目 | 完了PR | 概要 |
|---|------|--------|------|
| — | AI 対戦 | — | `src/game/ai.ts` でシンプルAI実装 |
| — | 地形システム | — | 4地形タイプ（防御補正・移動コスト）、ターン制統合 |
| — | イベント履歴 | — | `history` 配列 + ReplayViewer でリプレイ再生 |

### UI改善 (PR #17)

| # | 項目 | 概要 |
|---|------|------|
| A1 | GameOverOverlay テーマ統一 + ファイル分離 | グラスモーフィズム統一、CSS :hover化、85行を独立ファイルに |
| A2 | ReplayViewer テーマ統一 | ~150インラインスタイルをSCSSクラス化 |
| A3 | CellWithUnit バッジ SCSS化 | `.cell-badge--moved/--attacked` クラス |
| A4 | HPバー色 CSS変数統一 | `.stat-bar-fill--healthy/warning/critical` クラス |
| A5 | AnimationLayer SCSS化 | `.move-animation-marker`, `.attack-animation-marker` クラス |

---

## 残存項目

### 高優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| C3 | tutorialScenario Context化 | 中 | 複数コンポーネントの直接import → ScenarioContext 経由に変更。マルチシナリオ対応の基盤 |

### 中優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| D2 | 追加シナリオ | 中 | 難易度別マップ（小型/大型、異なるユニット構成） |
| D3 | 地形システム拡張 | 中 | 新地形タイプ追加（河川、丘陵等） |

### 低優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| — | Undo 機能 | 中 | 移動取り消し（history 基盤は実装済み） |
| — | ミニマップ | 大 | グリッド拡大時の全体俯瞰用 |
| — | コンポーネントテスト拡充 | 中 | 移動・攻撃フローのインタラクションテスト追加 |

### 改善バッチ1で完了（feat/improvement-batch-1）

| # | 項目 | 概要 |
|---|------|------|
| 4.2 | ユニットバランス調整 | Hero fighter HP 800→1000。Villain fighterと同等に統一 |
| D1 | セーブ/ロード | LocalStorage永続化。TurnBannerに保存ボタン、DifficultySelectにロードボタン |
| — | キーボード操作 | 矢印キーでグリッドカーソル移動、Enter選択、Escキャンセル、Tab+カーソル連動 |

---

## 推奨次ステップ

1. **C3**: ScenarioContext 導入（マルチシナリオ対応の基盤）
2. **D2**: 追加シナリオ（C3完了後に容易に実装可能）
3. **D3**: 地形システム拡張（新地形タイプ追加）
