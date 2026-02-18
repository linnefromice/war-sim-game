# TypeScript/JavaScript コーディングスタイル

> このファイルは [common/coding-style.md](../common/coding-style.md) を TypeScript/JavaScript 固有の内容で拡張します。

## イミュータビリティ

スプレッド演算子を使用してイミュータブルな更新を行います：

```typescript
// 誤り: ミューテーション
function updateUser(user, name) {
  user.name = name  // ミューテーション！
  return user
}

// 正解: イミュータビリティ
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## エラーハンドリング

async/await と try-catch を使用：

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

## 入力バリデーション

スキーマベースのバリデーションには Zod を使用：

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## Console.log

- プロダクションコードに `console.log` 文を残さない
- 代わりに適切なロギングライブラリを使用
- 自動検出についてはフックを参照
