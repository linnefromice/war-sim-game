# 試用・再現手順

Node は `.node-version`（24.22.1）、Yarn は既設の1.22系を使用する。

```bash
flock /tmp/research-hub-w2-w3-w8-heavy.lock yarn install --frozen-lockfile
yarn dev --host 127.0.0.1
```

表示されたループバックURLを同じ端末のブラウザで開く。外部公開・配信は行わない。

1. シナリオ選択からtutorialまたは短編3本を開始する。
2. 青のPlayer 1と赤のPlayer 2を同じ端末で交代して操作する。新規対戦は全てローカル2人用。
3. 味方をクリック/タップし、「移動」から移動先、または「攻撃」から武器・敵を選ぶ。各ユニットは各手番に移動と攻撃を1回ずつ行える。
4. 「確定」で手番を交代する。敵を全滅させた後も「確定」を押すと勝敗が決まる。
5. 結果画面で「同じ面で再戦」か「シナリオ選択へ」を選ぶ。再戦と別面の開始は全状態を初期化する。

キーボードはTabで戦場にフォーカスし、さらにTabで味方を選択する。行動ボタンと武器はTab/Shift+Tab/Enterで操作する。移動や武器を選ぶと戦場に戻るので、矢印で対象マスへ移動しEnterで決定する。Escで選択を解除する。複数の味方は手番表示下のユニット一覧ボタンからも選べる。ボタンにフォーカスがある時は、Enterはそのボタンだけを実行する。

狭い画面では盤面内を横スクロールする。ページ全体は横にはみ出さず、行動パネルは盤面の下にあり対象マスを覆わない。マスと行動パネルの間は縦スクロールして操作する。

保存は既存と同じlocalStorageの1枠。新規保存はversion 2で面IDとモードを含む。旧version 1はtutorial/元のCPU難易度で再開できる。旧セーブの再開以外にCPU選択入口は設けない。今回CPUや兵種・武装は増やしていない。保存不能・破損データは画面に表示する。ブラウザの保存データを消すと対戦セーブも消える。

## 自動検査

```bash
flock /tmp/research-hub-w2-w3-w8-heavy.lock bash -c 'yarn lint && yarn build && yarn test'
flock /tmp/research-hub-w2-w3-w8-heavy.lock node scripts/three-scenarios-traces.cjs
```

各traceは純粋reducerで初期配置から実行する。テスト用の勝者側は合法な接近と攻撃を選び、対戦側は手番終了のみを選ぶ。ゲーム本体に自動対戦機能は追加していない。各面で両陣営が勝利できる存在証明であり、戦略全体の均衡や人間の所要時間は保証しない。上限は200操作/80半手番、レイアウト変更は最大2回（今回は0回）。

ブラウザ検査は**既設**のPlaywrightとChromiumのみを使用する。以下のパスは本実行環境の例。存在しない場合は自動インストールせず停止する。

```bash
# 別ターミナル。ビルド済み出力をローカルで確認する場合
yarn preview --host 127.0.0.1 --port 4173

PLAYWRIGHT_MODULE=/home/paru/tmp/pw/node_modules/playwright \
CHROMIUM_EXECUTABLE=/home/paru/.cache/ms-playwright/chromium-1148/chrome-linux/chrome \
SCENARIOS_URL=http://127.0.0.1:4173 \
flock /tmp/research-hub-w2-w3-w8-heavy.lock node scripts/three-scenarios-browser.cjs
```

マウス6経路、キーボード1経路、タッチ2経路を正規UI操作だけで実行する。各経路で勝利→再戦→メニュー→別面→保存→再開まで検査する。状態注入やセーブの書き換えは行わない。1経路120入力以内・1操作30秒以内。`browser-results.json`、`images/`に証拠を保存する。さらに320/768/1366pxの全4面で操作パネルと盤面の非重複・ページ幅を検査し、`layout-results.json`に12件保存する。タッチでは結果の統計/リプレイが画面内に収まり、閉じられることも確認する。

## カバレッジ

lock済み依存にcoverageプラグインがないため、既設のVitest 4.0.16とcoverage-v8 4.0.16を**読み取りだけ**で再利用する。release判定のlint/build/testは本プロジェクトのVitest 4.0.18で別途実行する。バージョン混在の試行結果は採用していない。

```bash
SCENARIOS_VITEST_ROOT=/home/paru/repository/github.com/dev-bloom-so/dipsy-portal-web/node_modules \
flock /tmp/research-hub-w2-w3-w8-heavy.lock node scripts/three-scenarios-coverage.cjs
```

この補助スクリプトは一時config・matcher登録と、本repoのnode_modules内の一時symlinkだけを作り、終了時に撤去する。新規依存導入、lock更新、参照先repoの変更は行わない。既設runner/pluginが同じバージョンでなければ停止する。全production TS/TSX（未importのファイルを含む）を対象に、テスト・テスト補助・型宣言を除き、statement/branch/function/lineを各80%以上として判定する。集計は`coverage/coverage-summary.json`。

## Git操作時の配信抑止

既存Cloudflare PagesのGit連携がpush時に自動配信する。本実行の初回pushでpreviewが公開されたため、対象previewだけを削除した（`deployment-guard.json`）。以後はcommit messageとsquash件名の**先頭**を `[CF-Pages-Skip]` とし、Pagesだけをskipする。通常のGitHub CIは実行する。この指定ができない場合はpush/マージせず停止する。[Cloudflare公式仕様](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/#skipping-a-build-via-a-commit-message)。
