# 機能要件

| 項目 | 値 |
|------|-----|
| 文書タイトル | 機能要件 |
| Author | Engineering |
| Date | 2026-08-28 |
| Status | Approved |
| 対象リポジトリ | `war-sim-game` |
| 正本 | [as-built-design.md](./as-built-design.md) |
| 関連 | [機能要件](./functional-requirements.md) · [概要設計](./overview-design.md) · [アーキテクチャ](./architecture.md) |

本ドキュメントは現行ソースに基づく as-built 記述である。未実装機能は提案しない。

## 1. Overview

本システムは、ブラウザ上で動作するターン制の戦争シミュレーションゲームである。プレイヤー1（Hero, `id: 1`）が人間、プレイヤー2（Villan, `id: 2`, 定数 `AI_PLAYER_ID`）が AI として、13×10 グリッド上の軍事ユニットを操作し、相手の全ユニットを撃破した側が勝利する。

実装は React 18 + TypeScript strict + Vite の単一 SPA である。ゲームルールは React 非依存の純粋関数 `gameReducer`（`src/game/gameReducer.ts`）に閉じ、UI 状態は `uiReducer`（`src/pages/Stage/logics.ts`）が管理する。`src/pages/Stage/index.tsx` の `dispatch` が両 reducer とアニメーションを橋渡しする Two-Reducer パターンが中核である。ルーティングライブラリは使わず、`App.tsx` が難易度選択画面とステージ画面をローカル state で切り替える。

現行の実装済み機能は、移動/攻撃/ターン終了、地形（平地・森林・山岳・水域）、ユニット特殊能力、AI 3 難易度、セーブ/ロード（localStorage 単一スロット）、バトルログ、テキストリプレイ、戦績統計、キーボード操作、Error Boundary、GitHub Actions CI である。シナリオは `tutorialScenario` 1 本のみで、ゲームロジック層はこれを直接 import している。AI ターンのポインタロック、統計の `UNDO_MOVE` 再生、移動 BFS のユニット壁判定は部分実装または未保証である。

---


## 2. Goals & Non-Goals

### Goals（本ドキュメントの対象）

- 現行コードベースに存在する機能要件を、ファイル・型・アクション単位で記述する。
- ユーザー操作フロー、状態モデル、Two-Reducer のデータフローを、実装どおりに固定する。
- 既知の結合（`tutorialScenario` 直接参照、reducer が射程/占有を検証しない等）を隠さず記録する。

### Non-Goals（対象外）

- 未実装機能の設計（Fog of War、オンライン対戦、マップエディタ、キャンペーン、反撃、複数シナリオ選択、人間同士ローカル対戦など）。`IMPROVEMENT_PLAN.md` の残存項目は Open Questions / 参照に留める。
- ルールエンジンの書き換え、状態管理ライブラリ導入、バックエンド追加。
- 本ドキュメント作成時点でのアプリケーションコード変更。ドキュメントは `docs/` に配置する。

---


## 3. 機能要件

ステータスはソース根拠に基づく。`実装済み` = 本番コードパスが存在する。`部分実装` = 機能の骨格はあるが制約・未配線がある。`未実装` = コード上に本番パスがない。

### 3.1 ゲームセットアップとプレイヤー

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-001 | ゲームは 2 プレイヤー固定。Player 1 は Hero（青 `rgb[0,0,255]`）、Player 2 は Villan（赤 `rgb[255,0,0]`。シナリオ上の綴りは `Villan`） | 実装済み | `src/scenarios/tutorial.ts` `PLAYERS` |
| FR-002 | 人間は常に Player 1。Player 2 は AI（`AI_PLAYER_ID = 2`） | 実装済み | `src/constants/index.ts`, `Stage/index.tsx` AI `useEffect` |
| FR-003 | 起動時は難易度選択画面。Easy / Normal / Hard（ラベル: 初級 / 中級 / 上級）を選ぶとステージへ遷移する | 実装済み | `App.tsx`, `DifficultySelect.tsx` |
| FR-004 | 人間同士のローカル対戦、オンライン対戦は提供しない | 未実装 | `AI_PLAYER_ID` がハードコード。モード選択なし |
| FR-005 | シナリオ選択 UI はなく、常に `tutorialScenario`（id `"tutorial"`, name `"Tutorial Battle"`）を使用する | 実装済み（単一シナリオ） | `Stage/index.tsx` `ScenarioProvider scenario={tutorialScenario}` |

### 3.2 盤面・地形

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-010 | グリッドは 13 列 × 10 行。`Coordinate.x` が列、`y` が行（いずれも 0 始まり） | 実装済み | `tutorial.ts` `CELL_NUM_IN_ROW=13`, `ROW_NUM=10` |
| FR-011 | 地形タイプは `plain` / `forest` / `mountain` / `water` | 実装済み | `TerrainType`, `tutorial.ts` `TERRAIN` |
| FR-012 | 移動コスト: plain=1, forest=2, mountain=3, water=Infinity（進入不可） | 実装済み | `cellUtils.ts` `getTerrainMovementCost` |
| FR-013 | 防御補正: plain=0, forest=20%, mountain=40%, water=0。攻撃射程はマンハッタン距離で地形を無視（飛び越し） | 実装済み | `getTerrainDefenseReduction`, `isWithinRange` |
| FR-014 | セルホバーで地形名・DEF・MOVE コストをツールチップ表示する | 実装済み | `TerrainTooltip.tsx`（平地/森林/山岳/水域） |
| FR-015 | 中央帯に森林ストリップ、両翼山岳、中央水域 3 マス `(5,6)(6,6)(7,6)` を配置する | 実装済み | `tutorial.ts` rows 5–6 |

### 3.3 ユニット

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-020 | ユニット種別は `UnitCategory = "fighter" \| "tank" \| "soldier"` | 実装済み | `src/types/index.ts` |
| FR-021 | 各ユニットは不変 `spec`（id, name, unit_type, movement_range, max_hp, max_en, armaments）と可変 `status`（hp, en, coordinate, previousCoordinate, initialCoordinate, moved, attacked）を持つ | 実装済み | `UnitType` |
| FR-022 | 初期配置: Villain 9 体（fighter 3, tank 2, soldier 4）+ Hero 7 体（fighter 4, tank 1, soldier 2）。合計 16 体 | 実装済み | `tutorial.ts` `INITIAL_UNITS` id 1–16 |
| FR-023 | 武装はカテゴリ共通。fighter: Machine gun (POW 200 / RNG 2 / EN 50), Missile (400 / 3 / 100)。tank: Machine gun (200 / 2 / 75), Cannon (500 / 4 / 150)。soldier: Assault rifle (100 / 2 / 10), Grenade launcher (300 / 2 / 20), Suicide drone (500 / 3 / 75) | 実装済み | `src/constants/index.ts` `getAraments` |
| FR-024 | 特殊能力: fighter「強襲」（移動後攻撃 +20%）、tank「装甲陣地」（隣接味方ユニット防御 +10%）、soldier「迷彩」（森林防御 +20%） | 実装済み | `calculateDamage`, `UNIT_ABILITIES` |
| FR-025 | ユニットアイコンは JPG（`fighter.jpg` / `tank.jpg` / `army.jpg`）を `<img>` で表示する | 実装済み | `UnitIcon.tsx`。SVG は現行未使用 |
| FR-026 | 向きは `calculateOrientation(current, previousCoordinate)` で UP/DOWN/LEFT/RIGHT。同座標時は UP | 実装済み | `gameReducer.ts`, `CellWithUnit.tsx` |
| FR-027 | HP/EN バーをセル上に表示。HP は healthy (>50%) / warning (>25%) / critical | 実装済み | `CellWithUnit.tsx` `hpBarClass` |

### 3.4 ターンフローと行動

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-030 | ゲームは `activePlayerId = 1`, `turnNumber = 1`, `phase = { type: "playing" }` で開始する | 実装済み | `Stage/index.tsx` `initialGameState` |
| FR-031 | 自ターン中、各ユニットは移動 1 回・攻撃 1 回を独立に実行できる（順不同） | 実装済み | `moved` / `attacked` フラグ。UI はボタン disable、reducer はフラグ再実行を拒否しない |
| FR-032 | 移動到達判定は地形コスト BFS（`getReachableCells`）。ユニットは経路上の障害にならない。UI は**目的地**が占有されているときだけクリックを拒否する（通過は可）。`.cell-move-range` は空の到達セルのみ。reducer は境界と water のみ検査し、射程・占有は見ない | 部分実装 | `cellUtils.ts` は `units` を読まない。`MoveModeCell` は占有到達マスをハイライトせず `CellWithUnit` + `onClick` no-op。占有目的地でも reducer は受理する |
| FR-033 | 攻撃は選択武装の `range`（マンハッタン）内のユニットをクリックして実行。EN 不足の武装は選択不可 | 部分実装 | UI: `AttackModeCell` + EN disable。reducer は EN と手番のみ検査。射程・敵味方は reducer 非検査。UI も敵味方を区別せず、味方への攻撃が可能 |
| FR-034 | ダメージは `floor(armament.value * attackMultiplier * (1 - min(defenseReduction, 0.9)))`。命中率 100%、乱数なし | 実装済み | `calculateDamage`。`MAX_DEFENSE_REDUCTION = 0.9` |
| FR-035 | HP が 0 以下になった対象は `removeUnit` で盤面から削除する。勝敗判定は攻撃時ではなく `TURN_END` | 実装済み | `updateUnitsByAttack`, GamePhase テスト |
| FR-036 | 移動 Undo（ラベル「戻す」）は `moved && !attacked` のとき、`initialCoordinate` へ戻す | 実装済み | `UNDO_MOVE`。`TURN_END` は `initialCoordinate` を更新しないため、ターン開始位置ではなくスポーン位置へ戻る |
| FR-037 | ターン終了（ラベル「確定」）で、手番プレイヤーの EN を `max_en * 0.1` 回復（上限 `max_en`）、全ユニットの `moved`/`attacked` をリセットし、次プレイヤーへ切替 | 実装済み | `gameReducer` `TURN_END` |
| FR-038 | `turnNumber` は Player 1 に手番が戻ったときだけ +1 する | 実装済み | `nextPlayerId === tutorialScenario.players[0].id` |
| FR-039 | アニメーション中は入力を遮断する。移動 300ms、攻撃 600ms、ターン切替 1200ms。`prefers-reduced-motion: reduce` なら 0ms | 実装済み | `AnimationLayer.tsx` |
| FR-040 | 移動/攻撃完了後、そのユニットに残行動があればメニューを再オープンする | 実装済み | `dispatch` `ANIMATION_COMPLETE` |

### 3.5 勝敗

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-050 | `TURN_END` 時、次プレイヤーの残存ユニット数が 0 なら `phase = { type: "finished", winner: activePlayerId }` | 実装済み | `gameReducer.ts` |
| FR-051 | `phase.type === "finished"` のとき reducer は全アクションを無視する（`LOAD_STATE` を除く） | 実装済み | `gameReducer` 先頭ガード |
| FR-052 | 終了時 `GameOverOverlay` を表示。「Player {id} Wins!」+ 名前、Restart / リプレイ / 統計 | 実装済み | `GameOverOverlay.tsx` |
| FR-053 | Restart は難易度選択へ戻す（`App.tsx` `handleRestart` が `difficulty=null` + `restartKey++`） | 実装済み | `App.tsx` |
| FR-054 | 全滅以外の勝利条件（指定ユニット撃破、N ターン生存、地点到達）はない | 未実装 | `Scenario` に `winCondition` なし |

### 3.6 AI

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-060 | AI ターン開始時（`animationState` が idle かつ `playing`）に `computeAIActions(units, AI_PLAYER_ID, difficulty)` で全ユニット分を一括計画する。キュー先頭を **idle 確認後 500ms delay** して 1 手 dispatch し、移動 300ms / 攻撃 600ms / ターン切替 1200ms（`prefers-reduced-motion` なら 0）のアニメ完了まで次手を出さない。実時間ギャップは `500ms + animationDuration` | 実装済み | `Stage/index.tsx` AI `useEffect` の idle ガード + `setTimeout(..., 500)` |
| FR-061 | Easy: 最近敵へ接近し、射程内で生ダメージ最大の武装を選ぶ | 実装済み | `scoreAttack` `difficulty === "easy"` → `return damage`。採点時は下記 quirk あり |
| FR-062 | Normal: 撃破可能を最優先（+10000）、さもなくば負傷比率を加算 | 実装済み | `scoreAttack` |
| FR-063 | Hard: Normal に加え集中砲火（同一ターゲット +500/回）、等距離なら森林/山岳を優先（score 2/3）、HP < 30% なら最近敵から離れる | 実装済み | `shouldRetreat`, `getTerrainMovementScore`, `targetAttackCount` |
| FR-064 | AI は占有**目的地**へ移動せず（経路上のユニットは FR-032 どおり無視）、既行動ユニットはスキップし、敵がいなければ `turn_end` のみ | 実装済み | `ai.ts` の `occupiedCells` は着地セルのみ除外 + `ai.test.ts` |
| FR-065 | AI ターン中はキーボード入力を無視し、「確定」を disable する。グリッドの pointer lock はない | 実装済み | `handleKeyDown` の `AI_PLAYER_ID` ガード、`TurnBanner` `isEndTurnDisabled`。`dispatch` 自体は AI 手番を見ない |
| FR-066 | AI idle ギャップ（500ms delay 中およびアニメ非実行時）のポインタ入力は生きている。AI ユニットクリックは `playerId === activePlayerId` のため `OPEN_MENU` になり、`UnitStatusSummary` も AI ロスターを出す。人間が AI ユニットで `DO_MOVE` / `DO_ATTACK` でき、事前計画キューと盤面が乖離し得る。グリッドに `pointer-events: none` はない（アニメ overlay / tooltip のみ） | 部分実装 | `Stage/index.tsx` `dispatch`、`UnitStatusSummary.tsx`、`IdleCell`。フル AI ターン入力ロックは未実装 |

採点 quirk（FR-061〜063 共通）: `ai.ts` は `!hasMoved` なら `move` アクションを積んでいなくても `simulatedAttacker.status.moved = true` で `calculateDamage` する。fighter 強襲 +20% を見込んだスコアで武装を選び、実行時の reducer は `moved: false` のまま、という食い違いがあり得る。

### 3.7 永続化・リプレイ・統計・ログ

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-070 | TurnBanner「保存」で `localStorage` キー `war-sim-save` に `{ version: 1, gameState, difficulty, savedAt }` を JSON 保存 | 実装済み | `saveLoad.ts` `saveGame` |
| FR-071 | 難易度画面にセーブがあるとき「セーブデータをロード」を表示。ロード成功で `difficulty` + `loadedState` をセットし Stage を初期化する | 実装済み | `App.tsx` `handleLoad`, `useReducer(gameReducer, loadedState ?? initialGameState)` |
| FR-072 | オートセーブ、複数スロット、セーブ削除 UI はない。`deleteSave()` は export されるが UI から未呼び出し | 部分実装 | `saveLoad.ts`。`LOAD_STATE` アクションも UI からは未使用 |
| FR-073 | `history: GameAction[]` に `DO_MOVE` / `DO_ATTACK` / `TURN_END` / `UNDO_MOVE` を蓄積（上限なし）。手番チェック通過後は **units が変わらない no-op**（盤外・水域・EN 不足）でも history に追記する。BattleLog は未実行の移動/攻撃を表示し得る | 実装済み | `gameReducer` `DO_MOVE`/`DO_ATTACK` は常に `history: [...state.history, action]`。`LOAD_STATE` は history に残さない（置換） |
| FR-074 | バトルログは history を日本語でリアルタイム表示。折りたたみ・自動スクロール | 実装済み | `BattleLog.tsx`。no-op も文言化される（FR-073） |
| FR-075 | ゲームオーバーからテキストリプレイ（再生/停止/閉じる、1 秒/手、`gameReducer` でスナップショット再構築）。`UNDO_MOVE` は reducer 経由なので正しく戻る。no-op 再適用は無害 | 実装済み | `ReplayViewer.tsx`。盤面ビジュアル再生は未実装 |
| FR-076 | 統計は `computeStatistics` が history を独自シャドウ再生し、ターン数・ユニット別与ダメ/キル/被ダメ・MVP・プレイヤー集計を出す。扱うのは `TURN_END` / `DO_MOVE` / `DO_ATTACK` のみ。`UNDO_MOVE` は fall-through で座標も `moved` も戻さない。`DO_MOVE`→`UNDO_MOVE`→`DO_ATTACK` では 強襲 (+20%) が誤適用され、ReplayViewer と乖離する。EN 不足など no-op 攻撃も与ダメに数える | 部分実装 | `statistics.ts`。`UNDO_MOVE` 分岐なし。undo-then-attack のテストなし |

### 3.8 UI / UX

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-080 | 自ユニットクリックでアクションメニュー（移動 / 戻す / 攻撃+武装サブメニュー / 位置 2×2 / 閉じる） | 実装済み | `ActionButtons.tsx` |
| FR-081 | 敵ユニットクリックはメニューを開かず `INSPECT_UNIT`。詳細パネルは読み取り専用（敵バッジ付き） | 実装済み | `dispatch` `OPEN_MENU` 分岐, `UnitDetailPanel.tsx` |
| FR-082 | 攻撃モードで射程内ユニットに予測ダメージ、残 HP、能力 modifiers、DESTROY 表示 | 実装済み | `AttackModeCell.tsx` |
| FR-083 | `UnitStatusSummary` が手番ユニットを待機/移動済/攻撃済/行動完了で一覧し、クリックでメニューを開く | 実装済み | `UnitStatusSummary.tsx` |
| FR-084 | `TurnBanner` に TURN N、両軍ユニット数、手番名、AI バッジ、確定、保存 | 実装済み | `TurnBanner.tsx` |
| FR-085 | キーボード: Arrow でカーソル、Enter でセル相当操作、Esc でメニュー閉+カーソル解除、Tab で自軍ユニット巡回。マウスでメニューを開いただけでは `cursorPosition` は立たない。その状態の Enter は常に `TURN_END`（メニュー表示中でも確定）。ターン切替後もカーソルは残り、残留カーソルがあると Enter はセル操作になる | 部分実装 | `handleKeyDown`。数字キー武装選択はなし。Enter 移動は射程/占有を検証しない。`ANIMATION_START_TURN_CHANGE` は `cursorPosition` を保持（§5.2） |
| FR-086 | 近未来作戦端末テーマ（ミッドナイトブルー + シアングロー、グラスモーフィズム）。CSS 変数は `src/index.css` | 実装済み | `--color-bg-deep`, `--glass-bg` 等 |
| FR-087 | ランタイム例外は `ErrorBoundary` が「エラーが発生しました」+ 再試行で捕捉 | 実装済み | `src/components/ErrorBoundary.tsx` |
| FR-088 | 効果音/BGM、チュートリアルオーバーレイ、脅威範囲一括表示、モバイル専用レイアウトはない | 未実装 | コードパスなし |

### 3.9 品質・配信

| ID | 要件 | ステータス | 根拠 |
|----|------|------------|------|
| FR-090 | TypeScript strict（`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`） | 実装済み | `tsconfig.json` |
| FR-091 | ESLint 警告ゼロ（`--max-warnings 0`）。ESLint 8 + `.eslintrc.cjs` | 実装済み | `package.json` `lint` |
| FR-092 | Vitest + jsdom + Testing Library。現行 6 ファイル / 108 テスト全パス | 実装済み | `yarn test`（2026-08-28 実測） |
| FR-093 | CI は `main` への push/PR で `yarn lint` → `yarn build` → `yarn test` | 実装済み | `.github/workflows/ci.yml` |
| FR-094 | 本番は静的ホスト。README 上のデプロイ先は Cloudflare Pages `https://war-sim-game.pages.dev` | 実装済み | `README.md` |

---


## 11. Open Questions

プロダクト未決定ではなく、as-built 上「コードが黙っている」または計画上未着手の論点。

1. `UNDO_MOVE` → `initialCoordinate`（スポーン）は仕様かバグか。テストは同一ターンのスポーン復帰のみカバー。
2. 味方攻撃を許可するか。UI も reducer も禁止していない。
3. キーボード移動のバリデーションをマウスクリックと揃えるか。マウス到達判定も経路上ユニットを壁にしない現状を維持するか。
4. `LOAD_STATE` を SemVer 付きの正式ロード経路にするか、初期引数注入のままか。
5. `deleteSave` を UI に出すか。上書き保存のみで運用している。
6. 第二シナリオを足す前に T2（tutorial 参照排除）を必須とするか。現状は必須。
7. Player 2 表示名 `Villan` を `Villain` に直すか（テスト `Stage.test.tsx` が `"Villan"` を期待）。
8. `vite-plugin-svgr` を残すか。ユニットは JPG。
9. カバレッジしきい値を CI に入れるか。`cellUtils` / `saveLoad` が未テスト。`computeStatistics` の undo-then-attack も未カバー。
10. `IMPROVEMENT_PLAN.md` 記載のテスト件数 79 は現行 108 と不一致。計画書の現状評価をいつ更新するか。
11. AI ターン中のポインタをロックするか。現状はキーボードと「確定」のみ（FR-066）。
12. `computeStatistics` を `gameReducer` 再実行に寄せるか、`UNDO_MOVE` 分岐を足すか。現状はリプレイと契約が違う。
13. no-op の `DO_MOVE` / `DO_ATTACK` を history に残すか。units 参照変化時のみ append するか。
14. ターン切替後の `cursorPosition` リークを消すか。RESET を idle 後に送るか、`ANIMATION_COMPLETE` で `INITIAL_ACTION_MENU` に戻すか。

---


## 12. References

### リポジトリドキュメント

- [README.md](README.md) — セットアップ、コマンド、旧寄りの構成図
- [CLAUDE.md](CLAUDE.md) — エージェント向けアーキテクチャ要約（SVG、ファイル一覧が部分的に古い）
- [CLAUDE.local.md](CLAUDE.local.md) — ローカルタスクファイル規約（本ドキュメントの git 配置とは別）
- [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) — 完了済み機能と残存バックログ（最終更新 2026-02-19）

### 中核ソース

- `src/types/index.ts` — `DispatchAction`, `UnitType`, `AnimationState`, payloads
- `src/types/scenario.ts` — `Scenario`
- `src/game/types.ts` — `GameState`, `GameAction`, `GamePhase`
- `src/game/gameReducer.ts` — ルールと `calculateDamage`
- `src/game/ai.ts` — `computeAIActions`, `AIDifficulty`
- `src/game/saveLoad.ts` — localStorage
- `src/game/statistics.ts` — `computeStatistics`
- `src/game/utils.ts` — `manhattanDistance`
- `src/pages/Stage/index.tsx` — dispatch ブリッジ、AI、キーボード
- `src/pages/Stage/logics.ts` — `uiReducer`
- `src/pages/Stage/cellUtils.ts` — BFS / マンハッタン
- `src/scenarios/tutorial.ts` — 盤面・ユニット・地形
- `src/constants/index.ts` — 武装と能力
- `src/App.tsx`, `src/main.tsx`, `src/contexts/ScenarioContext.tsx`
- `src/components/ErrorBoundary.tsx`
- `.github/workflows/ci.yml`, `vite.config.ts`, `package.json`

### 契約としてのテスト

- `src/game/gameReducer.test.ts`
- `src/game/ai.test.ts`
- `src/game/statistics.test.ts`
- `src/pages/Stage/logics.test.ts`
- `src/pages/Stage/Stage.test.tsx`
- `src/pages/Stage/StageWin.test.tsx`

### 先行作品（計画書が参照。本 as-built の実装根拠ではない）

Fire Emblem（戦闘予測、Undo）、Advance Wars（地形防御）、Into the Breach（決定論・小型グリッド）

---

