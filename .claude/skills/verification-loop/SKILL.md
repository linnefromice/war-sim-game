# 検証ループスキル

Claude Codeセッション用の包括的な検証システム。

## 使用タイミング

以下の場合にこのスキルを呼び出す:
- 機能または重要なコード変更を完了した後
- PRを作成する前
- 品質ゲートが通ることを確認したい時
- リファクタリング後

## 検証フェーズ

### フェーズ1: ビルド検証
<!-- CUSTOMIZE: プロジェクトのパッケージマネージャーに合わせてコマンドを変更してください -->
```bash
# プロジェクトがビルドされるかチェック
npm run build 2>&1 | tail -20
```

ビルドが失敗したら、続行する前に停止して修正。

### フェーズ2: 型チェック
```bash
# TypeScriptプロジェクト
npx tsc --noEmit 2>&1 | head -30

# Pythonプロジェクト
pyright . 2>&1 | head -30
```

すべての型エラーを報告。続行する前にクリティカルなものを修正。

### フェーズ3: Lintチェック
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30
```

### フェーズ4: テストスイート
```bash
# カバレッジ付きでテスト実行
npm run test -- --coverage 2>&1 | tail -50

# カバレッジ閾値をチェック
# 目標: 最低80%
```

レポート:
- 総テスト数: X
- 合格: X
- 不合格: X
- カバレッジ: X%

### フェーズ5: セキュリティスキャン
```bash
# シークレットをチェック
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -10
grep -rn "api_key" --include="*.ts" --include="*.js" . 2>/dev/null | head -10

# console.logをチェック
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```

### フェーズ6: 差分レビュー
```bash
# 変更内容を表示
git diff --stat
git diff HEAD~1 --name-only
```

各変更ファイルを以下の観点でレビュー:
- 意図しない変更
- 欠落したエラーハンドリング
- 潜在的なエッジケース

## 出力フォーマット

すべてのフェーズ実行後、検証レポートを生成:

```
検証レポート
==================

ビルド:     [PASS/FAIL]
型:        [PASS/FAIL] (Xエラー)
Lint:      [PASS/FAIL] (X警告)
テスト:    [PASS/FAIL] (X/Y合格、Z%カバレッジ)
セキュリティ: [PASS/FAIL] (X問題)
差分:      [Xファイル変更]

総合:      PR [準備完了/未完了]

修正すべき問題:
1. ...
2. ...
```

## 継続モード

長いセッションでは、15分ごとまたは大きな変更後に検証を実行:

```markdown
メンタルチェックポイントを設定:
- 各関数完了後
- コンポーネント完成後
- 次のタスクに移る前

実行: /verify
```

## フックとの統合

このスキルはPostToolUseフックを補完するが、より深い検証を提供。
フックは問題を即座にキャッチ; このスキルは包括的なレビューを提供。
