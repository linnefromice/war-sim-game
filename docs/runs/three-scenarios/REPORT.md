# Three scenarios REPORT

実装・ローカル検証・セルフレビュー・修正後PR CIはPASS。統合先は[PR #32](https://github.com/linnefromice/war-sim-game/pull/32)。最終記録commit後も同headのCIを必ず確認し、合格時だけ `[CF-Pages-Skip]` を件名先頭にしたsquashを実行する。最終merge commitはPRの履歴を参照。STOPPED以降は新段に入らず、CI確認・Git統合・clean/upstream確認と配信抑止の読取検証だけを行う。

## 成果

- tutorialを保持し、はじめの射程 / 混成小隊 / 森の交差点を追加。
- 新規対戦は全4面でローカル2人交代。面選択→正規操作→最後の撃破→確定で勝敗→同面再戦/メニュー→別面まで接続。
- 面・再戦の切替でHP/EN・座標・向き・行動済み・手番・勝者・履歴・UI選択・カーソル・アニメーションを初期化。
- 既存v1セーブをtutorial/元のCPUモードで再開でき、新規v2セーブは面IDを保持。保存は従来の1枠。新CPU/新兵種/武装/キャンペーン/保存枠は追加していない。
- 不正な移動・射程外/味方/再攻撃・不足EN・未知ID・不正武器を拒否。取消が後の手番でもspawnへ戻らないよう修正。統計/リプレイも選択面と取消を反映。
- 行動パネルを盤面の下へ配置。狭い画面では盤面内だけを横スクロール。既存統計/リプレイの横溢れ・統計を閉じられない問題も修正。

## 検証

| 関門 | 結果 |
| --- | --- |
| 元のb1d0d81独立baseline | lint/build/108 tests PASS |
| project release checks | yarn lint / yarn build / yarn test、144/144 PASS |
| production coverage | statement 91.20%、branch 86.50%、function 85.78%、line 92.85%。各80% threshold PASS |
| 合法trace | 3面×両勝者、6本 PASS。12/13、21/22、39/40操作。上限200操作/80半手番を維持 |
| ブラウザ正規操作 | マウス6、キーボード1、タッチ2の9経路 PASS。最大97/120入力。状態注入なし |
| ブラウザのリセット/保存 | 勝敗→再戦→メニュー→別面→保存→再開 PASS |
| レイアウト | 320/768/1366px×全4面、12件 PASS。操作パネルが盤面を覆わず、ページ横溢れなし |
| 結果UI | タッチで統計/リプレイが画面内に収まり、閉じる操作もPASS |
| 元データ維持 | tutorial/兵種union/武装/既存AI/lock/packageに変更なし |
| セルフレビュー | SELF_REVIEW.md。重大・高優先度の未解決指摘なし |
| 修正後PR CI | [run 40544771745](https://github.com/linnefromice/war-sim-game/actions/runs/40544771745)、head 531bde0、PASS |

最初のPR CIは長い操作テスト1件が5000msに達して失敗した。制限も検査内容も緩めず、fake timerの自動tickを20ms→1msとしてidle待ちを削減。修正後は全ローカル検査とPR CIが合格。`ci-initial-failure.txt`と`ci-result.json`に保存した。

カバレッジはlockにプラグインがないため、既設の同一バージョンVitest/coverage-v8 4.0.16の組合せを読み取りだけで再利用。release checksは本repoのVitest 4.0.18で別途実施。全production TS/TSXと未importファイルを対象とし、テスト・テスト補助・型宣言を除外。新規ツール/依存導入、lock更新、他repo書込みは行っていない。

## 配信に関する事象と是正

最初のpushが既存Cloudflare PagesのGit連携を発火し、preview公開が発生した。push前の自動配信設定確認が不足しており、「配信なし」とは記録しない。

今回のpreview（e92456fc-7fff-4b61-9d09-3a2c3ef4462d、branch/commit/environment一致を確認）だけを既設の認証・ツールで撤去し、API 404を確認。本番deploymentはf9bb8224-46f6-4da4-b7fb-56bbdb02025b / b1d0d81のまま。

以後のpushとsquashは公式の `[CF-Pages-Skip]` prefixで抑止する。修正commitでは `is_skipped=true`、全stage未開始、aliasなし、本番不変をAPIで確認済み。証拠と公式仕様へのリンクは`deployment-guard.json`。手動publishは行っていない。GitHub CIはskipしていない。

## SHA・再現・試用上の注意

- 検証済みsource commit: `531bde06bf0ae581751e7af4550afec52165157b`。
- src tree: `ed68dc42916b4e80ee7b8095da2d42f4093f4bcd`。
- scripts tree: `d6ffada32662ed615d754bd07767bb9ef0985b08`。
- `SOURCE_SHA256SUMS`: 全ソース/スクリプト/lock/設定のSHA256。
- `DATA_SHA256SUMS`: シナリオ・武装定数・6本traceのSHA256。manifest自体: `ba240a48eece86494e1fab7fbacf52dbfe33e93954e443d6868206c58c6c81cc`。
- `EVIDENCE_SHA256SUMS`: ログ・画像・ブラウザ/レイアウト/CI/配信抑止の証拠。`sha256sum -c docs/runs/three-scenarios/{SOURCE,DATA,EVIDENCE}_SHA256SUMS`で確認できる。
- 起動・操作・trace再生成・既設ブラウザ/coverageの再現手順は[README.md](README.md)。画像は`images/`。

traceは受動的な相手への合法な勝利到達の存在証明であり、全戦略の均衡・人のプレイ時間は保証しない。タッチはChromiumエミュレーション。実機全種の保証ではない。保存は1件で、ブラウザデータ削除により失われる。

## 実行枠・停止

開始2026-10-27 16:20:16 UTC（10/28 01:20:16 JST）。新段打切り22:20:16 UTC、終了目標23:20:16 UTC。30分台で関門を完了し、時間を待たず終端処理へ進む。単独Codex、レイアウト変更0回、固定検証上限の緩和なし。

本実行のローカルdev/previewサーバーは停止済み。一時coverage symlink/configは撤去済み。rcm cleanupと見守り停止は起動元の担当であり、本実行では実施しない。最後に最終headのCI・squash・mainとorigin/mainの一致・作業ツリーclean・配信skipを確認して停止する。
