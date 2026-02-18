---
description: "PRのCIを確認してマージし、デフォルトブランチに戻る"
---

# Merge PR

指定されたPR（またはカレントブランチのPR）のCIを確認し、パスしていればマージしてデフォルトブランチに戻してください。

## 引数

`$ARGUMENTS` が指定されていれば PR 番号として使用する。指定がなければカレントブランチに紐づく PR を自動検出する。

## 手順

### 1. PR の特定

引数がある場合:
```bash
gh pr view $ARGUMENTS --json number,title,state,headRefName
```

引数がない場合:
```bash
gh pr view --json number,title,state,headRefName
```

- PR が見つからなければ報告して終了
- 既に MERGED / CLOSED なら報告して終了

### 2. CI 状態の確認

```bash
gh pr checks <PR番号>
```

- **全パス**: ステップ3に進む
- **pending あり**: `gh pr checks <PR番号> --watch` で完了まで待機（タイムアウト5分）
- **失敗あり**: 失敗した checks を報告して **停止**（マージしない）

### 3. マージ

```bash
gh pr merge <PR番号> --merge
```

- マージ失敗（コンフリクト等）の場合は報告して停止

### 4. デフォルトブランチに切り替え

```bash
# デフォルトブランチ名を動的に取得
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'

git checkout <default-branch>
git pull
```

### 5. ローカルブランチのクリーンアップ

マージ済みのフィーチャーブランチをローカルから削除:
```bash
git branch -d <feature-branch>
```

### 6. 結果報告

- マージされた PR の URL
- 現在のブランチ（デフォルトブランチ）
- クリーンアップされたブランチ

## ルール

- CI が失敗している場合は絶対にマージしない
- マージ戦略は `--merge`（マージコミット）を使用
- force push やブランチ削除の強制（`-D`）は行わない
- デフォルトブランチへの直接プッシュは行わない
