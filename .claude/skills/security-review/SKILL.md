---
name: security-review
description: Use this skill when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment/sensitive features. Provides comprehensive security checklist and patterns.
---

# セキュリティレビュースキル

このスキルはすべてのコードがセキュリティベストプラクティスに従い、潜在的な脆弱性を特定することを保証する。

## 発動タイミング

- 認証や認可を実装する時
- ユーザー入力やファイルアップロードを処理する時
- 新しいAPIエンドポイントを作成する時
- シークレットや認証情報を扱う時
- 決済機能を実装する時
- 機密データを保存または送信する時
- サードパーティAPIを統合する時

## セキュリティチェックリスト

### 1. シークレット管理

#### ❌ 絶対にしないこと
```typescript
const apiKey = "sk-proj-xxxxx"  // ハードコードされたシークレット
const dbPassword = "password123" // ソースコード内
```

#### ✅ 常にすること
```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

// シークレットが存在することを確認
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

#### 確認手順
- [ ] ハードコードされたAPIキー、トークン、パスワードなし
- [ ] すべてのシークレットは環境変数に
- [ ] `.env.local`が.gitignoreに
- [ ] git履歴にシークレットなし
- [ ] 本番シークレットはホスティングプラットフォーム（Vercel、Railway）に

### 2. 入力バリデーション

#### ユーザー入力は常にバリデーション
```typescript
import { z } from 'zod'

// バリデーションスキーマを定義
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})

// 処理前にバリデーション
export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input)
    return await db.users.create(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    throw error
  }
}
```

#### ファイルアップロードバリデーション
```typescript
function validateFileUpload(file: File) {
  // サイズチェック（最大5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('File too large (max 5MB)')
  }

  // タイプチェック
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // 拡張子チェック
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }

  return true
}
```

#### 確認手順
- [ ] すべてのユーザー入力がスキーマでバリデーション済み
- [ ] ファイルアップロードが制限済み（サイズ、タイプ、拡張子）
- [ ] クエリでユーザー入力を直接使用していない
- [ ] ホワイトリストバリデーション（ブラックリストではない）
- [ ] エラーメッセージが機密情報を漏らさない

### 3. SQLインジェクション防止

#### ❌ 絶対にSQLを連結しない
```typescript
// 危険 - SQLインジェクション脆弱性
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
await db.query(query)
```

#### ✅ 常にパラメータ化クエリを使用
```typescript
// 安全 - パラメータ化クエリ
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)

// または生SQLで
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
)
```

#### 確認手順
- [ ] すべてのデータベースクエリがパラメータ化クエリを使用
- [ ] SQLで文字列連結なし
- [ ] ORM/クエリビルダーを正しく使用
- [ ] Supabaseクエリが適切にサニタイズ

### 4. 認証と認可

#### JWTトークン処理
```typescript
// ❌ 間違い: localStorage（XSSに脆弱）
localStorage.setItem('token', token)

// ✅ 正しい: httpOnlyクッキー
res.setHeader('Set-Cookie',
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
```

#### 認可チェック
```typescript
export async function deleteUser(userId: string, requesterId: string) {
  // 常に最初に認可を確認
  const requester = await db.users.findUnique({
    where: { id: requesterId }
  })

  if (requester.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  // 削除を実行
  await db.users.delete({ where: { id: userId } })
}
```

#### Row Level Security（Supabase）
```sql
-- すべてのテーブルでRLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### 確認手順
- [ ] トークンがhttpOnlyクッキーに保存（localStorageではない）
- [ ] 機密操作前に認可チェック
- [ ] SupabaseでRow Level Securityが有効
- [ ] ロールベースアクセス制御を実装
- [ ] セッション管理が安全

### 5. XSS防止

#### HTMLをサニタイズ
```typescript
import DOMPurify from 'isomorphic-dompurify'

// 常にユーザー提供のHTMLをサニタイズ
function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

#### Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]
```

#### 確認手順
- [ ] ユーザー提供HTMLがサニタイズ済み
- [ ] CSPヘッダーが設定済み
- [ ] 未検証の動的コンテンツレンダリングなし
- [ ] Reactの組み込みXSS保護を使用

### 6. CSRF保護

#### CSRFトークン
```typescript
import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  const token = request.headers.get('X-CSRF-Token')

  if (!csrf.verify(token)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // リクエストを処理
}
```

#### SameSiteクッキー
```typescript
res.setHeader('Set-Cookie',
  `session=${sessionId}; HttpOnly; Secure; SameSite=Strict`)
```

#### 確認手順
- [ ] 状態変更操作にCSRFトークン
- [ ] すべてのクッキーにSameSite=Strict
- [ ] ダブルサブミットクッキーパターンを実装

### 7. レート制限

#### APIレート制限
```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // ウィンドウあたり100リクエスト
  message: 'Too many requests'
})

// ルートに適用
app.use('/api/', limiter)
```

#### コストの高い操作
```typescript
// 検索に対する厳しいレート制限
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 10, // 1分あたり10リクエスト
  message: 'Too many search requests'
})

app.use('/api/search', searchLimiter)
```

#### 確認手順
- [ ] すべてのAPIエンドポイントにレート制限
- [ ] コストの高い操作により厳しい制限
- [ ] IPベースのレート制限
- [ ] ユーザーベースのレート制限（認証済み）

### 8. 機密データ露出

#### ロギング
```typescript
// ❌ 間違い: 機密データをログ
console.log('User login:', { email, password })
console.log('Payment:', { cardNumber, cvv })

// ✅ 正しい: 機密データを編集
console.log('User login:', { email, userId })
console.log('Payment:', { last4: card.last4, userId })
```

#### エラーメッセージ
```typescript
// ❌ 間違い: 内部詳細を公開
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  )
}

// ✅ 正しい: 一般的なエラーメッセージ
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  )
}
```

#### 確認手順
- [ ] ログにパスワード、トークン、シークレットなし
- [ ] ユーザー向けエラーメッセージは一般的
- [ ] 詳細エラーはサーバーログのみ
- [ ] ユーザーにスタックトレースを公開しない

### 9. ブロックチェーンセキュリティ（Solana）

#### ウォレット検証
```typescript
import { verify } from '@solana/web3.js'

async function verifyWalletOwnership(
  publicKey: string,
  signature: string,
  message: string
) {
  try {
    const isValid = verify(
      Buffer.from(message),
      Buffer.from(signature, 'base64'),
      Buffer.from(publicKey, 'base64')
    )
    return isValid
  } catch (error) {
    return false
  }
}
```

#### 確認手順
- [ ] ウォレット署名を検証
- [ ] トランザクション詳細を検証
- [ ] トランザクション前に残高チェック
- [ ] ブラインドトランザクション署名なし

### 10. 依存関係セキュリティ

#### 定期的な更新
```bash
# 脆弱性をチェック
npm audit

# 自動修正可能な問題を修正
npm audit fix

# 依存関係を更新
npm update

# 古いパッケージをチェック
npm outdated
```

#### ロックファイル
```bash
# 常にロックファイルをコミット
git add package-lock.json

# CI/CDで再現可能なビルドのために使用
npm ci  # npm installの代わりに
```

#### 確認手順
- [ ] 依存関係が最新
- [ ] 既知の脆弱性なし（npm auditクリーン）
- [ ] ロックファイルをコミット
- [ ] GitHubでDependabotを有効
- [ ] 定期的なセキュリティ更新

## デプロイ前セキュリティチェックリスト

本番デプロイ前に必ず:

- [ ] **シークレット**: ハードコードされたシークレットなし、すべて環境変数に
- [ ] **入力バリデーション**: すべてのユーザー入力がバリデーション済み
- [ ] **SQLインジェクション**: すべてのクエリがパラメータ化
- [ ] **XSS**: ユーザーコンテンツがサニタイズ済み
- [ ] **CSRF**: 保護が有効
- [ ] **認証**: 適切なトークン処理
- [ ] **認可**: ロールチェックが配置
- [ ] **レート制限**: すべてのエンドポイントで有効
- [ ] **HTTPS**: 本番で強制
- [ ] **セキュリティヘッダー**: CSP、X-Frame-Optionsが設定
- [ ] **エラーハンドリング**: エラーに機密データなし
- [ ] **ロギング**: 機密データをログしない
- [ ] **依存関係**: 最新、脆弱性なし
- [ ] **Row Level Security**: Supabaseで有効
- [ ] **CORS**: 適切に設定
- [ ] **ファイルアップロード**: バリデーション済み（サイズ、タイプ）
- [ ] **ウォレット署名**: 検証済み（ブロックチェーンの場合）

## リソース

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Web Security Academy](https://portswigger.net/web-security)

---

**覚えておくこと**: セキュリティはオプションではない。1つの脆弱性がプラットフォーム全体を危険にさらす可能性がある。迷ったら、慎重な側に倒す。
