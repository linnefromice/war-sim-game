# Gitワークフロー

## コミットメッセージ形式

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

注: 属性は ~/.claude/settings.json でグローバルに無効化されています。

## プルリクエストワークフロー

PR作成時:
1. 完全なコミット履歴を分析する（最新のコミットだけでなく）
2. `git diff [base-branch]...HEAD` ですべての変更を確認する
3. 包括的なPRサマリーを作成する
4. TODOを含むテスト計画を記載する
5. 新規ブランチの場合は `-u` フラグでプッシュする

## 機能実装ワークフロー

1. **まず計画**
   - **planner** エージェントで実装計画を作成する
   - 依存関係とリスクを特定する
   - フェーズに分解する

2. **TDDアプローチ**
   - **tdd-guide** エージェントを使用する
   - まずテストを書く（RED）
   - テストをパスする実装を行う（GREEN）
   - リファクタリング（IMPROVE）
   - 80%以上のカバレッジを確認する

3. **コードレビュー**
   - コードを書いた直後に **code-reviewer** エージェントを使用する
   - CRITICALとHIGHの問題に対処する
   - 可能な限りMEDIUMの問題を修正する

4. **コミット＆プッシュ**
   - 詳細なコミットメッセージを書く
   - Conventional Commits形式に従う
