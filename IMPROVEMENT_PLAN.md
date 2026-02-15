# war-sim-game 改善計画

最終更新: 2026-02-15

## 現状評価

### 強み（維持すべき）
- TypeScript strict mode + 純粋関数ベースの reducer
- テスト36件が全パス（Vitest）、実行8ms
- 依存ライブラリ最小限（本番4、開発9）
- 一方向データフロー（useReducer + Context）
- ロジックとUIの明確な分離（logics.ts が純粋関数）

### 総合グレード
- コード品質: A-（strict types, tests, lint passing）
- アーキテクチャ: B+（分離は良いが拡張性に課題）
- 完成度: C（コア動作するがMVP未達）
- パフォーマンス: C+（機能するが最適化なし）

---

## Phase 1: アーキテクチャ基盤（開発持続性の根幹）

### 1.1 ゲームステートとUIステートの分離

**問題**: `logics.ts` の reducer が「ゲームエンジン」と「UIコントローラ」を兼務している。

```
現状: 1つの reducer が全てを管理
  StateType = {
    activePlayerId   ← ゲームモデル
    units            ← ゲームモデル
    actionMenu       ← UI状態（メニュー開閉、選択中の武器…）
  }
```

`OPEN_MENU` / `CLOSE_MENU` はUI操作、`DO_MOVE` / `DO_ATTACK` はゲームルール。同じ関数に共存するため、ゲームルール変更がUI側のバグリスクを生む。

**改善案**: 2層 reducer に分離

```typescript
// src/game/gameReducer.ts — React に一切依存しない
type GameState = {
  activePlayerId: number;
  units: UnitType[];
  turnNumber: number;
  phase: GamePhase;
  history: GameAction[];
}
// DO_MOVE, DO_ATTACK, TURN_END, CHECK_WIN のみ

// src/pages/Stage/uiReducer.ts — 操作状態のみ
type UIState = {
  selectedUnitId: number | null;
  actionMode: "idle" | "move" | "attack";
  selectedArmamentIdx: number | null;
}
// SELECT_UNIT, SELECT_MOVE_MODE, SELECT_ATTACK_MODE, DESELECT のみ
```

**効果**:
- `gameReducer` はヘッドレステスト、AI ロジック、サーバーサイド再利用が可能
- UI リファクタリングがゲームロジックに波及しない
- 各 reducer が小さくなり可読性向上

**工数**: 中（既存テストの書き換え含む）

---

### 1.2 GamePhase の導入

**問題**: 「ゲーム開始」「ゲーム終了」「勝敗判定」の概念がない。全ユニット撃破してもゲームが続行する。

**改善案**:

```typescript
type GamePhase =
  | { type: "setup" }
  | { type: "playing" }
  | { type: "finished"; winner: number }

// TURN_END 時に自動チェック
const newUnits = /* TURN_END 処理後のユニット */;
const nextId = nextPlayer(state.activePlayerId, PLAYERS).id;
if (newUnits.filter(u => u.playerId === nextId).length === 0) {
  return { ...state, phase: { type: "finished", winner: state.activePlayerId }, units: newUnits };
}
```

**効果**: 勝敗判定・リスタート・シナリオ選択画面の前提条件が整う

**工数**: 小

---

### 1.3 `unit_type` を union 型に変更

**問題**: `unit_type: number` (1/2/3) がコメント頼り。`UnitIcon.tsx`、`constants/index.ts`、`getAraments()` が全て number 分岐。

```typescript
// 現状
unit_type: number;  // 1: fighterjet, 2: tank, 3: soldier（コメントのみ）

// 改善案
type UnitCategory = "fighter" | "tank" | "soldier";
```

**効果**:
- 新ユニット種追加時の「番号間違い」バグが消える
- TypeScript の網羅性チェック（`switch` exhaustive check）が効く
- `getAraments()` の magic number 分岐が型安全な分岐に変わる

**工数**: 小

---

### 1.4 シナリオデータの外出し

**問題**: `constants/index.ts` に全ユニット13体がハードコード。マップ追加やバランス調整のたびにコード変更が必要。

**改善案**:

```typescript
// src/scenarios/tutorial.ts
export const tutorialScenario: Scenario = {
  id: "tutorial",
  name: "Tutorial Battle",
  gridSize: { rows: 10, cols: 13 },
  players: [
    { id: 1, name: "Hero", rgb: [0, 0, 255] },
    { id: 2, name: "Villain", rgb: [255, 0, 0] },
  ],
  units: [/* ... */],
  winCondition: "eliminate_all",
}

// src/types/scenario.ts
type Scenario = {
  id: string;
  name: string;
  gridSize: { rows: number; cols: number };
  players: Player[];
  units: UnitType[];
  winCondition: WinCondition;
}
```

**効果**:
- マップエディタ・AI訓練・テストフィクスチャがシナリオ定義だけで完結
- `ROW_NUM` / `CELL_NUM_IN_ROW` のハードコードも解消
- バランス調整がコード変更なしで可能

**工数**: 中

---

## Phase 2: コンポーネント設計改善

### 2.1 Cell.tsx の責務分割

**問題**: `Cell.tsx` (82-172行) が1つのコンポーネントで5つの責務を担う。

1. 射程内判定 (`isWithinRange`)
2. アクションモード分岐（移動 / 攻撃 / 通常）
3. ユニット有無の分岐
4. dispatch 構築
5. スタイル決定

さらに `as PayloadMoveActionType` キャスト（L120, L145）が残存。

**改善案**: モード別コンポーネントに分離

```
Cell.tsx → 座標とモードに応じて適切なセルを選択するだけ
  ├── MoveModeCell.tsx    → 移動範囲表示 + 移動ディスパッチ
  ├── AttackModeCell.tsx  → 攻撃範囲表示 + 攻撃ディスパッチ
  └── IdleCell.tsx        → 通常表示 + ユニット選択
```

**効果**: 各コンポーネントが単一責務、`as` キャスト除去、テスト容易

**工数**: 小

---

### 2.2 ActionMenu の分離

**問題**: `Stage/index.tsx` 内にインラインで `ActionMenu` コンポーネントが定義されている（69-148行）。Stage の関心（グリッド描画）と ActionMenu の関心（操作UI）が混在。

**改善案**: `Stage/ActionMenu.tsx` として独立ファイルに抽出。

**工数**: 小

---

### 2.3 パフォーマンス最適化

**問題**:
- `Stage/index.tsx:34` — 毎レンダリングで `unitsCoordinates` マップを再構築（`useMemo` なし）
- `Cell` コンポーネントに `React.memo` なし（130セル全てが毎回再レンダリング）

**改善案**:

```typescript
// useMemo で座標マップをキャッシュ
const unitsCoordinates = useMemo(() => {
  return state.units.reduce((map, unit) => { /* ... */ }, new Map());
}, [state.units]);

// Cell を React.memo でラップ
export const Cell = React.memo(({ x, y, unitId }: CellProps) => {
  // ...
});
```

**効果**: 不要な再レンダリング削減。ユニット数・グリッドサイズ増加時に顕著。

**工数**: 小

---

## Phase 3: 開発インフラ

### 3.1 CI/CD 構築

**問題**: lint / type check / test / build の自動実行がない。PRマージ時にビルド破壊を検知できない。

**改善案**: GitHub Actions で最低限のパイプラインを追加。

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn build   # tsc + vite build
      - run: yarn test
```

**工数**: 小

---

### 3.2 コンポーネントテストの追加

**現状**: logics.ts のユニットテスト36件のみ。コンポーネントテスト・インタラクションテストはゼロ。

**改善案**: React Testing Library を導入し、主要操作フローをテスト。

```
優先テスト対象:
1. ユニット選択 → アクションメニュー表示
2. 移動モード → 範囲ハイライト → セルクリック → 移動完了
3. 攻撃モード → 武器選択 → ターゲットクリック → ダメージ適用
4. ターン終了 → プレイヤー切替
5. 勝敗判定 → 結果画面表示（Phase 1.2 実装後）
```

**工数**: 中

---

### 3.3 SVG アセット最適化

**問題**: `armyTank.svg` が 205KB（他の2つは 3KB / 7KB）。

**改善案**: SVGO で圧縮（目標 < 50KB）。ビルドパイプラインに組み込み。

**工数**: 小

---

## Phase 4: ゲーム完成度（MVP達成）

### 4.1 勝敗判定 + リスタート

Phase 1.2 の GamePhase を基盤として:
- 全ユニット撃破 → 勝利画面表示
- リスタートボタン → initialState に戻す

### 4.2 ユニットバランス調整

**現状の不均衡**:
| プレイヤー | ユニット数 | 構成 |
|-----------|-----------|------|
| Player 1 (Hero) | 4体 | VF-171 ×4（全て同一） |
| Player 2 (Villain) | 9体 | Fighter×3, Tank×2, Soldier×4 |

Player 1 が数でも種類でも圧倒的に不利。

### 4.3 残存 TODO の解消

| ファイル | 行 | 内容 |
|---------|-----|------|
| Cell.tsx | :96 | `// TODO: consider background by action` |
| Cell.tsx | :150 | `// TODO: clean` |

---

## Phase 5: UX 向上（将来）

| 項目 | 概要 |
|------|------|
| 移動アニメーション | ユニット移動時のスムーズな遷移 |
| 攻撃エフェクト | ダメージ数値表示、爆発エフェクト |
| ダメージプレビュー | 攻撃前に予測ダメージを表示 |
| Undo 機能 | 移動取り消し（Phase 1 の history 基盤が前提） |
| キーボード操作 | 矢印キー + Enter/Esc |

---

## Phase 6: 機能拡張（将来）

| 項目 | 概要 |
|------|------|
| AI 対戦 | シンプルな評価関数 → ミニマックス法 |
| 地形システム | 障害物、カバー、地形効果 |
| セーブ/ロード | LocalStorage でゲーム状態永続化 |
| イベント履歴 | undo / リプレイ / AI分析の基盤 |

---

## 実装優先度マトリクス

| 優先度 | 項目 | Phase | 効果 | 工数 |
|--------|------|-------|------|------|
| **1** | ゲーム/UI ステート分離 | 1.1 | 全ての今後の開発の基盤 | 中 |
| **2** | GamePhase 導入 | 1.2 | 勝敗・リスタート・シナリオ選択の前提 | 小 |
| **3** | CI/CD 構築 | 3.1 | 回帰バグ防止 | 小 |
| **4** | unit_type union 型化 | 1.3 | 型安全性向上 | 小 |
| **5** | Cell.tsx 分割 | 2.1 | 可読性・テスタビリティ向上 | 小 |
| **6** | パフォーマンス最適化 | 2.3 | 不要な再レンダリング削減 | 小 |
| **7** | シナリオデータ外出し | 1.4 | バランス調整・テストの高速化 | 中 |
| **8** | コンポーネントテスト | 3.2 | UI回帰バグ防止 | 中 |
| **9** | 勝敗判定 + リスタート | 4.1 | MVP 達成 | 小 |
| **10** | バランス調整 | 4.2 | ゲームプレイ品質 | 小 |

**推奨**: 優先度 1-3 を先に実装すれば、以降の全ての改善が安全かつ高速に進められる。
