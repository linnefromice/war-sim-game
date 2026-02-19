# war-sim-game 改善計画

最終更新: 2026-02-19

## 現状評価

### 強み（維持すべき）
- TypeScript strict mode + 純粋関数ベースの reducer
- テスト79件が全パス（Vitest）、49件のゲームロジックテスト含む
- 依存ライブラリ最小限（本番4、開発9）
- 一方向データフロー（useReducer + Context）
- ロジックとUIの明確な分離（gameReducer.ts + logics.ts の Two-Reducer パターン）
- 近未来作戦端末テーマ（グラスモーフィズム + シアングロー）で統一されたUI
- AI対戦機能（Easy/Normal/Hard 3段階）・リプレイシステム実装済み
- 地形システム（平地/森林/山岳/水域）による戦術的深み
- ユニット特殊能力（強襲/装甲陣地/迷彩）でカテゴリ間の差別化

### 総合グレード
- コード品質: A（strict types, 79 tests, lint passing, SCSS統一）
- アーキテクチャ: A-（Two-Reducer分離, シナリオ型定義, Cell分割, ScenarioContext）
- 完成度: B+（コア動作、勝敗判定、AI難易度、リプレイ、統計完備）
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
| 3.2 | コンポーネントテスト | — | Stage.test.tsx (4件), StageWin.test.tsx (1件) 追加。79件全テストパス |
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

### 6-Feature バッチ (PR #21)

| # | 項目 | 概要 |
|---|------|------|
| A2 | 敵ユニット情報閲覧 | `INSPECT_UNIT` アクション + `inspectedUnitId` で敵ユニットの HP/EN/武装を読み取り専用表示 |
| A3 | ユニット行動状態サマリー | `UnitStatusSummary.tsx` で待機/移動済/攻撃済/行動完了をアイコン+バッジで一覧表示 |
| A4 | AI ターン行動ログ | `BattleLog.tsx` で移動・攻撃・Undo・ターン終了をリアルタイム表示。折りたたみ・自動スクロール対応 |
| B3 | ユニット特殊能力 | Fighter「強襲」(+20%), Tank「装甲陣地」(+10%防御), Soldier「迷彩」(+20%森林防御)。`calculateDamage()` に統合 |
| B4 | AI 難易度3段階 | `DifficultySelect.tsx` で Easy/Normal/Hard 選択。Hard: 集中砲火・地形利用・撤退ロジック |
| D1 | 戦績統計・リザルト画面 | `statistics.ts` で統計計算。GameOverOverlay に MVP・プレイヤー別統計・ユニット別内訳を表示 |

### コード品質改善

| # | 項目 | 概要 |
|---|------|------|
| H3 | ダメージ計算共通関数化 | `gameReducer.ts` に `calculateDamage()` 関数を追加。4箇所の重複ロジックを統合 |

---

## 残存項目

### カテゴリ 1: アーキテクチャ・型安全性

#### 高優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| T1 | `PayloadType` Discriminated Union 化 | 中 | 全アクションで共通の optional フィールド → アクションごとの型安全な union に変更。dispatch 内の undefined チェック排除 |
| T2 | tutorialScenario 直接参照排除 | 中 | `gameReducer.ts`, `ai.ts`, `cellUtils.ts` が `tutorialScenario` を直接 import。シナリオを引数で渡す方式に変更。マルチシナリオ対応の最大ブロッカー |

#### 中優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| T3 | ActionContext の分離 | 小 | `Stage/index.tsx` 内定義 → `src/contexts/ActionContext.tsx` に独立。循環依存リスク低減 |
| T4 | Cell の Context 依存による React.memo 無効化対策 | 中 | `useContext(ActionContext)` が Context 変更時に全130セルを再レンダリング。Context 分割 or selector パターン導入 |
| T5 | `dispatch` 関数の責務分割 | 中 | 約100行・12アクション分岐の巨大関数。animation/game/ui の middleware パターンに分割 |
| T6 | `StateActionMenuType` の配置見直し | 小 | ゲーム共通型ファイルから UI 固有型を `logics.ts` 近辺に移動 |

#### 低優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| T7 | `UnitSpecType.id` のトップレベル移動 | 小 | `spec.id`（インスタンスID）→ `UnitType.id` に変更。spec を純粋な仕様テンプレートに |
| T8 | history 配列の最大長制限 | 小 | 全アクション蓄積による無制限成長を防止。上限設定 or セーブポイント方式 |

### カテゴリ 2: コード品質・重複排除

#### 高優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| Q1 | `getTerrainClass` 共通化 | 小 | `IdleCell.tsx`, `MoveModeCell.tsx`, `AttackModeCell.tsx` の3箇所に完全同一コード → `cellUtils.ts` に抽出 |

#### 中優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| Q2 | `assertNever` 重複削除 | 小 | `constants/index.ts` と `UnitIcon.tsx` に同一定義 → `src/utils/typeGuards.ts` に共通化 |
| Q3 | `AI_PLAYER_ID` 重複削除 | 小 | `Stage/index.tsx` と `TurnBanner.tsx` に同一定数 → `src/constants/index.ts` に集約 |
| Q4 | snake_case / camelCase 統一 | 中 | `unit_type`, `movement_range`, `max_hp` 等の snake_case → TypeScript 規約の camelCase に統一 |
| Q5 | `Stage.scss` 分割 | 中 | 905行の単一ファイル → コンポーネント別に分割（Cell.scss, ActionButtons.scss, Animation.scss 等） |
| Q6 | `isPayloadMoveAction` / `isPayloadAttackAction` 整理 | 小 | `gameReducer.ts` と `index.tsx` に別実装 → T1（Discriminated Union）で不要化、または統合 |
| Q7 | Player 色管理ユーティリティ | 小 | 4ファイルで `rgb(${rgb[0]}, ...)` を手動展開 → `playerColor(player)` ヘルパーに統一 |

#### 低優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| Q8 | `App.css` デッドコード削除 | 小 | Vite テンプレートの `.logo`, `.card`, `.read-the-docs` スタイルが残存 |
| Q9 | テストヘルパー共通化 | 小 | `makeUnit()`, `coord()` が `gameReducer.test.ts` と `ai.test.ts` で重複 → `src/test/helpers.ts` に抽出 |
| Q10 | `CellWithUnit` の不要 inline style 削除 | 小 | `position: "relative"` が SCSS 側の `.cell` 定義と重複 |
| Q11 | hover state の CSS 化 | 小 | `IdleCell`, `MoveModeCell`, `AttackModeCell` の `useState(false)` → CSS `:hover` で代替 |

### カテゴリ 3: テスト・DX（開発者体験）

#### 中優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| DX1 | `cellUtils.getReachableCells` テスト追加 | 小 | ゲームプレイに直結する重要ロジックにテストなし |
| DX2 | テストカバレッジ計測導入 | 小 | `@vitest/coverage-v8` + vite.config.ts に coverage 設定追加 |
| DX3 | `sass`, `vite-plugin-svgr` を devDependencies に移動 | 小 | 本番不要な依存が `dependencies` に配置 |
| DX4 | ESLint v9 + flat config 移行 | 小 | ESLint 8 は EOL。`.eslintrc.cjs` → `eslint.config.js` へ移行 |
| DX5 | コンポーネントテスト拡充 | 中 | `ActionButtons`, `CellWithUnit`, `AnimationLayer`, `ReplayViewer` 等にテストなし |

#### 低優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| DX6 | パスエイリアス (`@/`) 導入 | 小 | `../../game/gameReducer` → `@/game/gameReducer` で深い相対パス解消 |
| DX7 | Vite 6 アップデート | 小 | Vite 4 → 6 へのメジャーアップデート |
| DX8 | E2E テスト導入 | 大 | Playwright で移動→攻撃→ターンエンド→AI→勝利の E2E テスト |

### カテゴリ 4: ゲーム機能拡張

#### 高優先度

| # | 項目 | 工数 | 概要 | 参考 |
|---|------|------|------|------|
| F1 | 敵脅威範囲表示 (Danger Zone) | 小 | 全敵の移動+攻撃範囲を赤色オーバーレイで一括表示。トグル切替 | FE, Advance Wars |
| F2 | 攻撃結果詳細プレビュー | 小 | ダメージ量・残HP・撃破可否・地形防御率を一覧パネルで表示 | FE (Combat Forecast) |
| F3 | 追加シナリオ（小型マップ） | 中 | 7x7, 5x5 の小型マップで短時間プレイ対応。T2（シナリオ依存排除）完了後に容易 | Into the Breach |
| F4 | AI 行動パターンの多様化 | 中 | 低HP撤退、集団行動（フォーカスファイア）、高防御地形移動優先など。既存 Easy/Normal/Hard に統合 | Advance Wars, FE |

#### 中優先度

| # | 項目 | 工数 | 概要 | 参考 |
|---|------|------|------|------|
| F5 | セーブ/ロード | 中 | LocalStorage で状態永続化。オートセーブ（ターン末自動）+ スロット制（3枠）手動セーブ | — |
| F6 | 勝利条件の多様化 | 中 | 全滅以外に「指定ユニット撃破」「Nターン生存」「特定地点到達」。`Scenario` 型に `winCondition` 追加 | FE, ItB |
| F7 | 2人対戦モード（ローカル） | 小 | AI固定 → モード選択（vs AI / vs Human）。`AI_PLAYER_ID` を条件分岐可能に | — |
| F8 | 確認ダイアログ（ターン終了） | 小 | 未行動ユニットがいる場合に警告表示。設定で ON/OFF 可能 | — |
| F9 | ターン巻き戻し拡張 | 中 | 既存の移動 Undo に加え、攻撃 Undo やターン単位の巻き戻しを追加。history 基盤活用 | FE (Turn Rewind) |
| F10 | 条件付きクリティカルヒット | 中 | 兵種固有のクリティカル条件（例: soldier=味方隣接でx1.5倍）。運要素なしの位置取り報酬 | Wargroove |
| F11 | EN 回復の戦略化 | 小 | 待機で20%回復、特定地形で30%回復など。地形システムとの相乗効果 | Advance Wars |
| F12 | 増援システム | 中 | 特定ターンに敵追加出現。`reinforcements: { turn, units }[]` をシナリオに定義 | FE |
| F13 | 難易度設定の深化 | 中 | Easy: AI弱体化+巻き戻し無制限 / Hard: AI強化+敵ステータス補正。AI改善(F4)と連動 | FE, ItB |
| F14 | ユニットバランス調整 | 小 | Hero 4体 vs Villain 9体の不均衡是正 | — |
| F15 | 地形システム拡張 | 中 | 新地形タイプ追加（河川: 移動コスト増、丘陵: 攻撃力補正等） | — |

#### 低優先度

| # | 項目 | 工数 | 概要 | 参考 |
|---|------|------|------|------|
| F16 | 反撃メカニクス | 大 | 被攻撃ユニットが射程内なら自動反撃（50%ダメージ）。攻撃側にリスクを追加 | FE |
| F17 | ユニット特殊能力の拡張 | 大 | 現状の3能力に加え、カテゴリ別の追加能力。`UnitAbility` 型拡張 | — |
| F18 | 武器の三すくみ | 中 | fighter > soldier > tank > fighter のような相性ダメージ補正 | FE |
| F19 | 霧の戦争 (Fog of War) | 中 | 視界範囲外を暗転。山岳で視界拡大、森に隠蔽。別ゲームモードとして実装 | Advance Wars |
| F20 | 地形の動的変化 | 大 | 攻撃で地形変化（爆発で森→平地など）。`TerrainType` の遷移ルール定義 | Triangle Strategy |
| F21 | キャンペーンモード | 中 | 複数シナリオを順番にプレイ。マップ間で一部状態引き継ぎ。F3完了後に検討 | FE, Wargroove |
| F22 | ユニット成長システム | 大 | 戦闘で経験値 → レベルアップでステータス上昇。キャンペーン(F21)前提 | FE |
| F23 | オンライン対戦 | 大 | WebSocket によるリアルタイム or 非同期対戦。サーバーインフラ必要 | AWBW |
| F24 | マップエディタ | 大 | グリッドサイズ設定→地形ペイント→ユニット配置→JSONエクスポートのWebエディタ | Wargroove, AWBW |

### カテゴリ 5: UX・エンゲージメント

#### 中優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| UX1 | シナリオ選択画面 | 中 | タイトル画面→シナリオ選択→ゲーム開始のフロー。既存 `DifficultySelect` を拡張 |
| UX2 | 戦況インジケータ（形勢バー） | 小 | TurnBanner に両プレイヤーの総HP比をバー表示。色は各プレイヤーカラー |
| UX3 | 移動経路プレビュー | 中 | 移動先ホバー時に出発→目的地の最短経路を線で表示。BFS に経路復元を追加 |
| UX4 | チュートリアルオーバーレイ | 中 | 初回プレイ時にステップバイステップガイド。localStorage でフラグ管理。スキップ可能 |
| UX5 | 効果音・BGM | 中 | 移動/攻撃/撃破/ターン切替時に SE。Web Audio API or Howler.js。音量設定+ミュート機能 |
| UX6 | 実績システム | 中 | 「初勝利」「全ユニット生存勝利」「10ターン以内」等。localStorage で永続化 |
| UX7 | スコア/評価システム | 小 | ターン数・被害率・撃破数で S/A/B/C 評価。リプレイ再生と連動 |
| UX8 | ビジュアルリプレイ | 大 | テキスト形式に加え、盤面を再現して1手ずつ再生。再生/一時停止/速度変更 |

#### 低優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| UX9 | ミニマップ | 大 | グリッド拡大時の全体俯瞰用 |

### カテゴリ 6: アクセシビリティ

#### 中優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| A11 | キーボード操作の完全対応 | 中 | 矢印キーでセル移動、Enter で決定、数字キーで武装選択。現在は Esc/Enter/Tab のみ対応 |
| A12 | 色覚バリアフリー対応 | 小 | 移動範囲/攻撃範囲にパターン（斜線/ドット）追加。色だけに依存しない区別 |

#### 低優先度

| # | 項目 | 工数 | 概要 |
|---|------|------|------|
| A13 | レスポンシブ・モバイル対応 | 大 | ピンチズーム、タッチ操作、レイアウト調整。`transform: scale()` でグリッド縮小 |
| A14 | スクリーンリーダー対応 | 中 | `role="grid"`, `aria-label`, `aria-live` 等の ARIA 属性付与 |

---

## 推奨実装ロードマップ

### Phase A: 重複排除・型安全化（短期・1-2日）

目的: コード品質の底上げとリファクタリング基盤の整備。

1. **Q1**: `getTerrainClass` 共通化（3ファイル重複削除）
2. **Q2 + Q3**: `assertNever`, `AI_PLAYER_ID` 重複削除
3. **Q8**: `App.css` デッドコード削除
4. **T1**: `PayloadType` Discriminated Union 化（型安全性の根本改善）

### Phase B: シナリオ依存排除（中期・2-3日）

目的: マルチシナリオ対応の最大ブロッカーを解消。

5. **T2**: `gameReducer`, `ai.ts`, `cellUtils.ts` から tutorialScenario 直接参照を排除

### Phase C: UX基盤強化（中期・1-2週間）

目的: 既存機能の延長でプレイ体験を大幅向上。

6. **F1**: 敵脅威範囲表示 (Danger Zone)
7. **F2**: 攻撃結果詳細プレビュー
8. **UX2**: 戦況インジケータ
9. **F8**: 確認ダイアログ（ターン終了）

### Phase D: コンテンツ拡充（中期・2-3週間）

目的: Phase B 完了を前提に、ゲームの幅を広げる。

10. **F3**: 追加シナリオ（小型マップ）
11. **UX1**: シナリオ選択画面
12. **F5**: セーブ/ロード
13. **F7**: 2人対戦モード

### Phase E: ゲーム性の深化（長期）

目的: 戦術的奥深さの追加。

14. **F4**: AI 行動パターン多様化
15. **F6**: 勝利条件の多様化
16. **F10**: 条件付きクリティカルヒット
17. **F12**: 増援システム

### Phase F: 拡張機能（将来的に）

18. **F24**: マップエディタ
19. **F16**: 反撃メカニクス
20. **F21**: キャンペーンモード
21. **F23**: オンライン対戦

---

## 効果が高い組み合わせ

| 組み合わせ | 相乗効果 |
|-----------|----------|
| F1 (Danger Zone) + F2 (戦闘予測) | 「どこが危険か」+「攻撃結果」の両方を可視化。情報に基づいた意思決定を完全サポート |
| F4 (AI多様化) + F13 (難易度深化) | AI品質向上が難易度の説得力を支える。行動パターン変化による自然な難易度差 |
| F6 (勝利条件) + F12 (増援) | 「耐える」「急ぐ」「守る」など多様な戦術を要求するシナリオ設計が可能に |
| F3 (追加シナリオ) + UX7 (スコア評価) | 短いマップ+スコアでアーケード的リプレイ性を実現。ブラウザゲーム向き |
| T2 (シナリオ依存排除) + F3 (追加シナリオ) | T2 がブロッカー解消 → F3 が容易に実装可能 |

---

## 競合タイトル分析メモ

本プロジェクトの機能拡張は以下のタイトルの設計を参考にしている。

| タイトル | 主な参考ポイント |
|---------|----------------|
| Fire Emblem | 戦闘予測ウィンドウ、ターン巻き戻し、クラスチェンジ、勝利条件多様化 |
| Advance Wars | 移動経路表示、地形防御星、Fog of War、AWBW（ブラウザ対戦の成功例） |
| Into the Breach | 完全情報設計、小型グリッド(8x8)、移動Undo、決定論的戦闘(命中率100%) |
| Triangle Strategy | 高低差、挟撃、地形の動的変化、TP(リソース)管理 |
| Wargroove | 条件付きクリティカル（運要素なし）、マップエディタ、UGC共有、スコア評価 |

詳細な調査結果は `.ai/tasks/records/20260219-competitive-analysis.md` を参照。
