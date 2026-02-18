---
description: "ローカルの変更から新規ブランチを作成してPRを作る"
---

# Create PR

ローカルの未コミット変更から新規ブランチを作成し、PRを作成してください。

## 引数

`$ARGUMENTS` が指定されていれば、PRのタイトルや説明のヒントとして使用する。

## 手順

### 1. 変更の確認

```bash
git status
git diff --stat
```

- 変更がなければ「変更がありません」と報告して終了
- `.env`, `credentials`, `.secret` 等のセンシティブファイルが含まれていないか確認

### 2. 変更の分析

- `git diff` で変更内容を把握
- 変更の種類を判定: feat / fix / refactor / docs / test / chore

### 3. ブランチ作成

- ブランチ名: `<type>/<short-description>`（例: `feat/add-search`, `fix/calculator-bug`）
- 現在のブランチがデフォルトブランチ（main/master）であることを確認
- デフォルトブランチでなければ、そのブランチ上でそのまま作業する

```bash
git checkout -b <branch-name>
```

### 4. ステージングとコミット

- 関連ファイルを個別にステージング（`git add -A` は使わない）
- `.env`, credentials, `.secret`, 大きなバイナリは除外
- Conventional Commits 形式でコミットメッセージを作成

### 5. プッシュ

```bash
git push -u origin <branch-name>
```

### 6. PR 作成

- `$ARGUMENTS` があればタイトル/説明に反映
- なければ変更内容から自動生成
- PR 本文に以下を含める:
  - Summary（変更概要のバレットポイント）
  - Test plan（テスト計画のチェックリスト）

```bash
gh pr create --title "<title>" --body "<body>"
```

### 7. 結果報告

PR の URL を出力する。

## ルール

- センシティブファイルは絶対にコミットしない
- `git add -A` や `git add .` は使わない — ファイルを個別に指定
- コミットメッセージは Conventional Commits 形式
- PR タイトルは70文字以内
