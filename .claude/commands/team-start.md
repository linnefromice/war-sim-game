---
description: Agent Teams を起動してタスクを並列実行する
---
# Team Start

Agent Teams を起動し、指定されたワークフローに基づいてチームを組成します。

## 使用方法

`/team-start [workflow-type] [task-description]`

$ARGUMENTS を解析し、以下のワークフロー種別に応じてチームを組成してください。

## ワークフロー種別

### feature（新機能開発）

3名の Teammate を spawn する:

1. **architect**: 設計・実装方針の策定
   - 対象コードベースを調査し、アーキテクチャを設計
   - 実装計画を作成し、Plan approval を要求
2. **implementer**: 主要な実装作業
   - architect の設計に基づいてコードを実装
   - 実装完了後にテストを作成・実行
3. **reviewer**: テストカバレッジと品質レビュー
   - 実装コードのレビュー（セキュリティ、パフォーマンス）
   - テストカバレッジの確認と追加テストの作成

タスク依存関係:
- architect のタスク完了後に implementer が開始
- implementer と reviewer は一部並列で作業可能

### review（コードレビュー）

3名の Teammate を spawn する:

1. **security-reviewer**: セキュリティ観点のレビュー
   - 脆弱性、認証・認可の問題、入力検証を確認
2. **performance-reviewer**: パフォーマンス観点のレビュー
   - N+1クエリ、メモリリーク、不要な計算を確認
3. **test-reviewer**: テストカバレッジの検証
   - テストの網羅性、エッジケース、テスト品質を確認

全 Teammate が並列で独立して作業する。

### debug（デバッグ・調査）

3名の Teammate を spawn する:

1. **hypothesis-a**: 仮説Aの調査
2. **hypothesis-b**: 仮説Bの調査
3. **hypothesis-c**: 仮説Cの調査

各 Teammate は異なる仮説を独立に検証し、互いの仮説を批判的に検討する。
科学的議論のように、反証に耐えた仮説を正解とする。

### refactor（リファクタリング）

3名の Teammate を spawn する:

1. **module-a**: モジュールA の担当
2. **module-b**: モジュールB の担当
3. **test-guardian**: テストの維持・更新担当
   - リファクタリング中もテストが通り続けることを保証

## 実行手順

1. **チームを作成**: TeamCreate でチームを組成する
2. **タスクを作成**: ワークフロー種別に応じたタスクを TaskCreate で作成（1人あたり5〜6個）
3. **依存関係を設定**: タスク間の依存関係を TaskUpdate で定義
4. **Teammate を spawn**: Task ツールで team_name を指定して Teammate を起動
5. **Delegate Mode を有効化**: `Shift+Tab` を押してリードの実装を制限

## 重要な指示

- **リードは実装を行わない**: 全ての実装は Teammate に委譲すること
- **十分なコンテキストを含める**: Teammate はリードの会話履歴を引き継がないため、spawn プロンプトに対象ファイルパス、期待する挙動、既知の問題を具体的に含めること
- **ファイル競合を避ける**: 各 Teammate が異なるファイルセットを担当するようタスクを設計すること
- **Teammate の完了を待つ**: リードが先に実装を始めないこと

## 引数

$ARGUMENTS:
- `feature <description>` - 新機能開発ワークフロー
- `review <description>` - コードレビューワークフロー
- `debug <description>` - デバッグ・調査ワークフロー
- `refactor <description>` - リファクタリングワークフロー
- `custom <team-size> <description>` - カスタムチーム構成
