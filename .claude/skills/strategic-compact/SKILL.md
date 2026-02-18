---
name: strategic-compact
description: Suggests manual context compaction at logical intervals to preserve context through task phases rather than arbitrary auto-compaction.
---

# 戦略的コンパクトスキル

任意の自動コンパクションに頼るのではなく、ワークフローの戦略的ポイントで手動`/compact`を提案。

## なぜ戦略的コンパクションなのか？

自動コンパクションは任意のポイントでトリガーされる:
- しばしばタスクの途中で、重要なコンテキストを失う
- 論理的なタスク境界を認識しない
- 複雑なマルチステップ操作を中断する可能性

論理的な境界での戦略的コンパクション:
- **探索後、実行前** - 調査コンテキストをコンパクトにし、実装計画は保持
- **マイルストーン完了後** - 次のフェーズのために新鮮なスタート
- **主要なコンテキスト切り替え前** - 別のタスク前に探索コンテキストをクリア

## 仕組み

`suggest-compact.sh`スクリプトはPreToolUse（Edit/Write）で実行され:

1. **ツールコールを追跡** - セッション内のツール呼び出しをカウント
2. **閾値検出** - 設定可能な閾値で提案（デフォルト: 50コール）
3. **定期的なリマインダー** - 閾値後25コールごとにリマインド

## フックセットアップ

`~/.claude/settings.json`に追加:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "tool == \"Edit\" || tool == \"Write\"",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/strategic-compact/suggest-compact.sh"
      }]
    }]
  }
}
```

## 設定

環境変数:
- `COMPACT_THRESHOLD` - 最初の提案前のツールコール数（デフォルト: 50）

## ベストプラクティス

1. **計画後にコンパクト** - 計画が確定したら、新鮮なスタートのためにコンパクト
2. **デバッグ後にコンパクト** - エラー解決コンテキストをクリアしてから継続
3. **実装中はコンパクトしない** - 関連する変更のためにコンテキストを保持
4. **提案を読む** - フックは*いつ*を教え、あなたが*するかどうか*を決める

## 関連

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - トークン最適化セクション
- メモリ永続化フック - コンパクションを生き延びる状態用
