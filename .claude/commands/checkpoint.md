# チェックポイントコマンド

ワークフロー内でチェックポイントを作成または検証します。

## 使用方法

`/checkpoint [create|verify|list] [name]`

## チェックポイントの作成

チェックポイント作成時:

1. `/verify quick`を実行して現在の状態がクリーンであることを確認
2. チェックポイント名でgit stashまたはコミットを作成
3. チェックポイントを`.claude/checkpoints.log`に記録:

```bash
echo "$(date +%Y-%m-%d-%H:%M) | $CHECKPOINT_NAME | $(git rev-parse --short HEAD)" >> .claude/checkpoints.log
```

4. チェックポイント作成を報告

## チェックポイントの検証

チェックポイントとの検証時:

1. ログからチェックポイントを読み取り
2. 現在の状態をチェックポイントと比較:
   - チェックポイント以降に追加されたファイル
   - チェックポイント以降に変更されたファイル
   - 現在と当時のテスト合格率
   - 現在と当時のカバレッジ

3. レポート:
```
CHECKPOINT COMPARISON: $NAME
============================
変更ファイル数: X
テスト: +Y 合格 / -Z 失敗
カバレッジ: +X% / -Y%
ビルド: [PASS/FAIL]
```

## チェックポイントの一覧

以下の情報でチェックポイントを表示:
- 名前
- タイムスタンプ
- Git SHA
- ステータス（現在、遅れ、進み）

## ワークフロー

典型的なチェックポイントフロー:

```
[開始] --> /checkpoint create "feature-start"
   |
[実装] --> /checkpoint create "core-done"
   |
[テスト] --> /checkpoint verify "core-done"
   |
[リファクタリング] --> /checkpoint create "refactor-done"
   |
[PR] --> /checkpoint verify "feature-start"
```

## 引数

$ARGUMENTS:
- `create <name>` - 名前付きチェックポイントを作成
- `verify <name>` - 名前付きチェックポイントと検証
- `list` - すべてのチェックポイントを表示
- `clear` - 古いチェックポイントを削除（最後の5つを保持）
