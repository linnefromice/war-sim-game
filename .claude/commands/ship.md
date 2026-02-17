---
description: "品質チェック → コミット → PR作成を一括実行。実装完了後のワンコマンド出荷フロー。"
---

# Ship（実装完了ワンコマンド）

実装作業後の品質チェック・コミット・PR作成を一括で実行する。

## 前提

- 実装済みのコード変更がワーキングツリーに存在すること
- main ブランチで作業中の場合は、先にフィーチャーブランチを作成する

## 実行フロー

```
┌──────────────────────────────────────────────┐
│ Phase 1: 品質チェック                        │
│   1. yarn lint                               │
│   2. yarn build                              │
│   3. yarn test                               │
│   失敗時: エラーを修正して再実行（最大3回）  │
├──────────────────────────────────────────────┤
│ Phase 2: コミット                            │
│   1. git status / git diff で変更内容を確認  │
│   2. git log で直近のコミットスタイルを確認   │
│   3. 変更ファイルをステージング              │
│   4. Conventional Commits 形式でコミット作成  │
├──────────────────────────────────────────────┤
│ Phase 3: プッシュ & PR                       │
│   1. git push -u origin <branch>             │
│   2. PRが未作成の場合 gh pr create           │
│   3. PR URLを報告                            │
└──────────────────────────────────────────────┘
```

## Phase 1: 品質チェック

以下を順番に実行する。失敗した場合はエラーを修正して **最大3回** リトライする。

```bash
yarn lint
yarn build
yarn test
```

## Phase 2: コミット

1. `git status` で未追跡ファイルと変更を確認
2. `git diff` でステージ済み・未ステージの差分を確認
3. `git log --oneline -5` で直近のコミットスタイルを確認
4. `git-workflow.md` に従い Conventional Commits 形式でコミット

### ブランチ確認

- 現在 main ブランチの場合 → ユーザーにブランチ名を確認してフィーチャーブランチを作成
- フィーチャーブランチの場合 → そのまま進行

## Phase 3: プッシュ & PR

1. `git push -u origin <branch>` でリモートにプッシュ
2. `gh pr list --head <branch>` で既存PRを確認
3. PRが未作成 → `gh pr create` で新規作成（ベース: main）
4. PRが作成済み → PR URLを報告

### PR 作成時のフォーマット

```
タイトル: Conventional Commits 形式の簡潔な要約

本文:
## Summary
- [変更内容のブレットポイント]

## Test plan
- [x] lint 通過
- [x] build 通過
- [x] テスト全通過（N件）
```

## 結果報告

```
## Ship 結果

### 品質チェック
- lint: ✅
- build: ✅
- test: ✅（N件通過）

### Git
- ブランチ: <branch-name>
- コミット: <commit-hash> <commit-message>

### PR: <PR URL>
```
