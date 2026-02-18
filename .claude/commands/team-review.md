---
description: Agent Teams の状態を確認し統合レポートを生成する
---
# Team Review

現在のチームの状態を確認し、進捗レポートを生成します。

## 使用方法

`/team-review [action]`

## アクション

### status（デフォルト）

チームの現在の状態を確認する:

1. **TaskList** で全タスクの状態を確認
2. 以下の情報をレポート:
   - 完了タスク数 / 全タスク数
   - 各 Teammate の担当タスクと進捗
   - ブロックされているタスクとその理由
   - アイドル中の Teammate

### synthesize

全 Teammate の作業結果を統合する:

1. 各 Teammate にメッセージを送り、作業結果のサマリーを要求
2. 受け取ったサマリーを以下のフォーマットで統合:

```
TEAM REPORT
====================
チーム名: [team-name]
ワークフロー: [workflow-type]
Teammate: [各 Teammate 名]

サマリー
-------
[全体の要約]

Teammate レポート
-----------------
[Teammate名]: [作業結果の要約]
...

変更ファイル
-----------
[変更されたファイルの一覧]

残課題
------
[未解決の課題があれば記載]

ステータス
----------
[COMPLETE / IN_PROGRESS / BLOCKED]
```

### shutdown

チームを安全に終了する:

1. 全 Teammate にシャットダウンリクエストを送信
2. 全 Teammate の終了を確認
3. TeamDelete でチームリソースをクリーンアップ

## 引数

$ARGUMENTS:
- `status` - チーム状態の確認（デフォルト）
- `synthesize` - 作業結果の統合レポート
- `shutdown` - チームの終了とクリーンアップ
