# モンハン速報（モンハン関連ニュースまとめ）

モンスターハンター関連のニュースを集めてまとめる静的サイトです。`docs/` がサイトルートで、そのままロリポップ（FTP）に置いて公開できます。

- 掲載するのは **見出し・要約の一部・元記事へのリンク** のみ（本文の転載はしない）
- 複数の媒体が同じことを報じたものは「注目の話題」としてまとめ、媒体数を ★ で示す
- **シリーズ別**（ワイルズ / ライズ / ワールド / Now / ストーリーズ / アウトランダーズ）と**種別**（新作・アップデート・イベント・コラボ・グッズ・攻略など）で絞り込める
- 賑やかしとして左右にモジュールを置いている: クエスト種別・シリーズ別の件数・よく出ている語・収集元（左）、**ニュースガチャ**・**今日の武器おみくじ**・公式アナウンス・あとで読む（右）
- 依存パッケージなしの Node 20 スクリプトで収集する（ビルドにだけ esbuild / sharp を使う）

**当サイトはファンによる非公式のまとめサイトで、株式会社カプコンとは関係ありません。** 「モンスターハンター」は株式会社カプコンの登録商標です。サイト名に商標を含めていないのもこのためです。

## 使い方

```bash
npm install          # esbuild / sharp（ビルド用のみ）
npm run collect      # ニュースを収集して docs/data/news.json を更新
npm run build        # site/ を最小化して docs/ に出力
npm start            # ビルドしてローカルサーバー（http://localhost:3260）
```

編集するのは `site/`（HTML / CSS / JS）です。**`docs/` の中身は直接編集しないでください**（次のビルドで上書きされます）。

## 構成

```
mhmatome/
  config.json            収集元・キーワード・カテゴリ・武器一覧
  server.mjs             ローカル確認用サーバー
  scripts/
    collect.mjs          収集本体
    build.mjs            site/ → docs/
    test-feeds.mjs       収集元の候補が生きているか試す開発ツール
    lib/sources.mjs      RSS / Google ニュース / Steam の取得
    lib/cluster.mjs      同じ話題のグループ化
    lib/xml.mjs          RSS/Atom パーサ（依存なし）
    lib/util.mjs         取得・保存の小物
  docs/                  公開ディレクトリ（サイトルート）
  data/state.json        前回の収集結果（新着判定・更新間隔の計算に使う。コミット対象）
```

## 収集のしくみ

| 収集元 | 内容 |
| --- | --- |
| ゲームメディアの RSS | 4Gamer / Game*Spark / インサイド / 電ファミニコゲーマー / AUTOMATON / GAME Watch / IGN Japan。総合フィードなので、モンハン関連のものだけを残す |
| Google ニュースの検索フィード | `config.json` の `googleNews.queries`（8 クエリ）。**掲載件数の大半はここから来る** |
| Steam の公式アナウンス | ワイルズ / ライズ / ワールドの `steam_community_announcements`。開発・運営の一次情報なので「公式」バッジを付け、キーワード判定と日本語判定を通さずそのまま載せる（英語のままのことが多い） |

絞り込みの流れは次のとおりです。

1. 公開から `maxArticleAgeDays`（既定 7 日）を過ぎたものを落とす
2. **画像ギャラリーのページを落とす**（`blockTitlePatterns`）。ウォーカープラスなどの `＜画像 3 / 20＞` というページが、何年も前の記事なのに新着として流れてくるため
3. 見出しに日本語が含まれないものを落とす（Steam の公式アナウンスは除く）
4. `keywords` に当たらないものを落とす。**「ワイルズ」「ライズ」単独は入れていません** — 『ルーンスケープ：ドラゴンワイルズ』のような無関係のタイトルを拾ってしまったためです。シリーズの判定（`series`）は「モンハン関連と分かった記事の中だけ」で行うので、そちらには単独の語を入れてあります
5. 見出しを正規化して重複をまとめる（同じ記事が元フィードと Google ニュースの両方から来るため）。元サイトの直リンクが手に入ったら Google 経由のリンクより優先する

収集は 1 回あたり数秒で、API キーは要りません。

## 更新の間隔について

**GitHub Actions の cron は当てになりません。** 同じアカウントの aimatome / trend-video-watcher で実測したところ、毎時 0 分でも 30 分おきでも、さらに 10 分おきに置いても、実際に走るのは約 3 時間に 1 回、ひどいときは 9 スロット連続で 0 回でした（2026-09-16）。

一方 `workflow_dispatch` と `repository_dispatch` は一度も失敗していません。そこで**更新の主役は外部トリガー**にしています。

### 外部から 30 分おきに叩く（本番の更新経路）

ロリポップの cron から、trend-video-watcher リポジトリにある `tools/trigger-collect.php` を実行します。このスクリプトは複数のリポジトリに `repository_dispatch` を送るので、**サーバー上に 1 つ置けば全サイトが更新されます**。このサイトを追加するときは、スクリプトの `REPOS` に `lumieregiurare-ops/mhmatome` を足してください。

手元から 1 回だけ叩いて確かめることもできます（`<TOKEN>` は Contents = Read and write の fine-grained token）。

```bash
curl -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer <TOKEN>" \
  https://api.github.com/repos/lumieregiurare-ops/mhmatome/dispatches \
  -d '{"event_type":"collect"}'
```

成功すると **204 No Content** が返ります。

### cron はフォールバック

配信されたとき用に 10 分おきの cron も残してあります。外部トリガーと二重に走らないよう、**前回の収集から 25 分たっていなければ即座に終了する**ガードを入れてあります（前回の時刻は `data/state.json` の `ranAt`）。空振りの回は 15 秒ほどで終わります。

サイトに出す「次の更新まで約 ○ 分」も cron の設定値ではなく、**実際に走った間隔の中央値**（直近 6 回分）から出しています。目安を過ぎたら「最終更新 ○ 分前」に切り替わります。

## 公開の設定（ロリポップ）

リポジトリの Settings → Secrets and variables → Actions で登録します。

**Secrets**

| 名前 | 内容 |
| --- | --- |
| `LOLIPOP_FTP_SERVER` | FTP サーバー名 |
| `LOLIPOP_FTP_USER` | FTP アカウント |
| `LOLIPOP_FTP_PASSWORD` | FTP パスワード |

**Variables**

| 名前 | 内容 |
| --- | --- |
| `DEPLOY_TARGET` | `lolipop`（この値のときだけアップロードする） |
| `LOLIPOP_SERVER_DIR` | サブドメインの公開ディレクトリ（例: `./mh/`。末尾のスラッシュ必須） |

サブドメインを決めたら `config.json` の `site.url` と `site/index.html` の OGP も合わせて更新してください。

## ブラウザに保存しているもの

| キー | 内容 |
| --- | --- |
| `mh:fav` | 「あとで読む」に入れた記事 |
| `mh:read` | 開いた記事（ニュースガチャで未読を優先するため） |
| `mh:state` | 選んでいるシリーズ・種別・並び順などの画面の状態 |

**localStorage にだけ**保存しています。サーバーには何も送りません。

## サイト名について

サイト名は「モンハン速報」です。変える場合は `config.json` の `site.title`、`site/index.html` の `<title>`・ロゴ・OGP・フッターを直してください（ドメインは変更不要です）。

## 収集元を増やすには

`config.json` の `feeds` に足すだけです。モンハン専門のフィードを足すときは `"always": true` を付けると、キーワード判定を通さずそのまま載ります。

追加の候補が生きているかは開発用ツールで確かめられます。

```bash
node scripts/test-feeds.mjs
```

2026-09 時点で使えなかったもの: ファミ通（404）/ 電撃オンライン（404）/ gamebiz（404）/ Gamer（403）。いずれも RSS が廃止されているか、アクセスが拒否されます。
