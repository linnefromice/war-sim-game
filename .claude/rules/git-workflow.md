# Gitワークフロー

Git操作とブランチ管理のルール。コミット、PR作成、機能実装時に適用。

---

## コミットメッセージ形式

```
<type>: <description>
```

| Type     | 用途             | 例                                           |
| -------- | ---------------- | -------------------------------------------- |
| feat     | 新機能追加       | `feat: Add move animation and attack effects`|
| fix      | バグ修正         | `fix: Resolve unit HP display issue`         |
| refactor | リファクタリング | `refactor: Extract common cell utilities`    |
| docs     | ドキュメント     | `docs: Update CLAUDE.md with new patterns`   |
| test     | テスト追加・修正 | `test: Add unit tests for gameReducer`       |
| chore    | 雑務             | `chore: Update dependencies`                 |
| perf     | パフォーマンス   | `perf: Optimize grid rendering`              |
| ci       | CI/CD設定        | `ci: Add build workflow`                     |

---

## プルリクエストワークフロー

PR作成時の必須ステップ:

1. `git log [base]..HEAD` で完全なコミット履歴を分析
2. `git diff [base-branch]...HEAD` ですべての変更を確認
3. PRサマリー作成（包括的な変更説明）
4. テスト計画をTODOリストで記載

---

## ブランチ命名規則

| プレフィックス | 用途             | 例                              |
| -------------- | ---------------- | ------------------------------- |
| `feat/`        | 新機能           | `feat/move-animation`           |
| `fix/`         | バグ修正         | `fix/hp-display`                |
| `refactor/`    | リファクタリング | `refactor/cell-components`      |
| `topic/`       | 複合的な変更     | `topic/update-claude-config`    |

---

## 禁止事項

| 操作                     | 理由                 |
| ------------------------ | -------------------- |
| `git push --force`       | 履歴破壊のリスク     |
| `git rebase -i` (共有後) | 他の開発者に影響     |
| mainへの直接push         | レビュープロセス回避 |

---

## 機能実装の順序

| 順序 | 作業内容     | 対象ファイル                       |
| ---- | ------------ | ---------------------------------- |
| 1    | 型定義       | `src/types/index.ts`               |
| 2    | ゲームロジック | `src/game/gameReducer.ts`        |
| 3    | UIロジック   | `src/pages/Stage/logics.ts`        |
| 4    | コンポーネント | `src/pages/Stage/*.tsx`          |
| 5    | スタイル     | `src/pages/Stage/Stage.scss`       |
| 6    | テスト       | `src/**/*.test.ts(x)`             |
