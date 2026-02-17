---
description: "品質チェックを順次実行（lint → build → test）"
---

# Quality Check

品質チェックコマンドを順次実行し、問題があれば報告する。

## 実行順序

以下のコマンドを順番に実行する。各ステップが失敗した場合はエラー内容を報告して停止する。

```bash
# Step 1: Lint
yarn lint

# Step 2: Type-check + Build
yarn build

# Step 3: Test
yarn test
```

## 結果報告

```
## Quality Check 結果

| チェック | 結果 |
|---------|------|
| lint    | ✅ / ❌ |
| build   | ✅ / ❌ |
| test    | ✅ / ❌ (N件通過) |
```

## 失敗時の対応

- **lint 失敗**: ESLint エラーを修正（`--max-warnings 0` のため warning も修正が必要）
- **build 失敗**: TypeScript の型エラーを修正
- **test 失敗**: テスト失敗の内容を分析し修正
