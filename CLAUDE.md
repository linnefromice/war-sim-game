# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turn-based war simulation game built with React 18 + TypeScript (strict mode) + Vite. Two players control military units (fighters, tanks, soldiers) on a grid, taking turns to move and attack until one side is eliminated.

## Commands

```bash
yarn install          # Install dependencies
yarn dev              # Dev server (Vite)
yarn build            # Type-check (tsc) + production build
yarn lint             # ESLint with zero-warning policy
yarn test             # Run all tests once (vitest run)
yarn test:watch       # Watch mode
npx vitest run src/game/gameReducer.test.ts           # Single test file
npx vitest run -t "removes target unit"               # Single test by name
```

CI runs `yarn lint`, `yarn build`, `yarn test` on push/PR to main.

## Architecture

### Two-Reducer Pattern

Game state and UI state are managed by separate reducers, both coordinated through a unified `dispatch` in `Stage/index.tsx`:

- **`src/game/gameReducer.ts`** — Pure game logic, no React dependency. Handles `DO_MOVE`, `DO_ATTACK`, `TURN_END`. Manages `GameState` (activePlayerId, units, phase). Win detection happens at `TURN_END` (not during attacks).
- **`src/pages/Stage/logics.ts`** — UI-only reducer (`uiReducer`). Handles `OPEN_MENU`, `CLOSE_MENU`, `SELECT_MOVE`, `SELECT_ATTACK`, `RESET`. Manages action menu state.
- **`src/pages/Stage/index.tsx`** — Bridges both reducers via a single `dispatch` function exposed through `ActionContext`. The `ActionType` union covers all actions; the dispatch function routes to the appropriate reducer.

### Key Types (`src/types/index.ts`)

- `UnitCategory = "fighter" | "tank" | "soldier"` — exhaustive switch-friendly union
- `UnitType = { spec: UnitSpecType, status: UnitStatusType, playerId: number }` — spec is immutable config, status is mutable game state
- `GamePhase = { type: "playing" } | { type: "finished"; winner: number }`
- `Coordinate = { x, y }` — x is column (0-indexed), y is row (0-indexed)

### Scenario System

`src/scenarios/tutorial.ts` defines the single scenario (grid size, players, initial units). `src/constants/index.ts` provides armament data per `UnitCategory`. Currently hardcoded to the tutorial scenario; `gameReducer` references `tutorialScenario` directly for grid bounds and player list.

### Cell Component Hierarchy

`Cell.tsx` (React.memo) dispatches to mode-specific sub-components:
- `IdleCell` — default state, shows unit with CellWithUnit or empty cell
- `MoveModeCell` — highlights movement range, handles move dispatch
- `AttackModeCell` — highlights attack range, handles attack dispatch
- `CellWithUnit` — renders unit icon, HP/EN bars, orientation, player color

Range calculation uses Manhattan distance (`cellUtils.ts:isWithinRange`).

### SVG Assets

Unit icons imported as React components via `vite-plugin-svgr` using `?react` suffix (e.g., `import Icon from "file.svg?react"`).

## Testing

- **Vitest** with jsdom environment, globals enabled, CSS disabled
- Test setup: `src/test/setup.ts` imports `@testing-library/jest-dom/vitest`
- Component tests must mock `UnitIcon` (SVG imports fail in jsdom): `vi.mock("./UnitIcon", ...)`
- `StageWin.test.tsx` demonstrates mocking `tutorialScenario` for minimal grid tests
- Game logic tests use helper factories: `makeUnit()`, `makeGameState()`, `coord()`

## UI Language

Action menu labels are in Japanese: 移動 (Move), 攻撃 (Attack), 確定 (End Turn), 閉じる (Close).

## Claude Code Configuration (`.claude/`)

### Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `planner` | Implementation planning | Complex features (3+ steps), multi-file changes |
| `code-reviewer` | Code review | After 10+ line changes, before PR creation |
| `qa-specialist` | Test strategy | Test design, coverage analysis |
| `refactor-cleaner` | Dead code cleanup | Unused code removal, deduplication |

### Commands

| Command | Purpose |
|---------|---------|
| `/check` | Run `yarn lint` → `yarn build` → `yarn test` sequentially |
| `/ship` | Quality checks → commit → push → PR creation (one-command deploy) |

### Rules

| Rule | Purpose |
|------|---------|
| `task-completion` | Checklist: lint → build → test → commit → PR before marking task done |
| `git-workflow` | Conventional Commits format, branch naming, implementation order |

## Improvement Plan

`IMPROVEMENT_PLAN.md` contains the full roadmap with prioritized phases. Key remaining items: component performance optimization, additional scenarios, AI opponents.



## Agent Team Operational Rules

このプロジェクトでは Claude Code の Agent Teams を活用します。
以下のルールは全 Teammate に適用されます。

### Agent Teams の自動起動

複雑なタスクでは、`/team-start` コマンドなしでも Agent Teams が自動的に組成されます。
起動基準の詳細は `.claude/rules/agent-teams.md` を参照してください。

- タスクの複雑さに応じて、Claude が自律的にチーム起動を判断します
- 起動前にユーザーへ理由を説明し、承認を得てからチームを組成します
- ユーザーが拒否した場合は、即座に単独作業に切り替えます

### チーム構成の原則

- 並列作業が有効なタスクでは、Agent Teams を積極的に活用する
- リード（team lead）は調整に専念し、実装はすべて Teammate が行う
- Delegate Mode（`Shift+Tab`）を使用してリードの実装を構造的に制限する

### Teammate の行動規範

- **能動的な取得**: 共有タスクリストから能動的に未着手タスクを claim すること
- **即時通信**: 共通インターフェースに影響が出る変更は、即座に関連 Teammate にメッセージを送ること
- **品質ゲート**: テストを実行せずにタスクを Complete とマークしないこと
- **コンテキスト共有**: 発見した重要な情報は他の Teammate と共有すること

### タスク設計ガイドライン

- 1人あたり 5〜6 タスクの粒度で分割する
- タスク間の依存関係を明示的に定義する
- リスクの高い変更には Plan approval を要求する

### ファイル競合の防止

- 2人の Teammate が同一ファイルを編集しないよう、担当範囲を分割する
- 共有ファイルへの変更が必要な場合は、事前に担当者間で調整する
