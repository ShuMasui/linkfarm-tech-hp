# 03. ルート戦略

URL の設計と、Astro のファイル配置との対応を定義する。

---

## 1. 方針

**1ページのLPから、階層を持つ団体サイトへ移行する。**

旧構成はトップ1枚にすべてのセクションを積み、アンカーリンク（`/#problem` など）で移動していた。新構成では、団体としての情報（事業・概要・メンバー・日誌・連絡先）をそれぞれ独立したページに分け、トップは**表紙と目次**に徹する。

理由は [01-overview.md](./01-overview.md) にある通り、想定読者が5種類いるため。誰が来ても2クリック以内に目的へ降りられることを、トップの唯一の仕事とする。

### URL の規則

- `trailingSlash: 'always'`（`astro.config.mjs` で設定済み）。すべてのURLは `/` で終わる
- 小文字・ハイフン区切り。アンダースコアとキャメルケースは使わない
- 階層は最大2段。3段目を作らない
- 日本語URLは使わない

---

## 2. ルート一覧

| URL | ページ | § | Astro ファイル | モック |
|---|---|---|---|---|
| `/` | トップ（表紙＋目次＋写真＋パートナー） | — | `src/pages/index.astro` | `web-view.html` |
| `/services/` | 事業内容 | 01 | `src/pages/services/index.astro` | `services-view.html` |
| `/services/experience-learning/` | 体験型学習プロジェクト 詳細 | — | `src/pages/services/experience-learning.astro` | `project-view.html` |
| `/organization/` | 団体概要 | 02 | `src/pages/organization/index.astro` | `organization-view.html` |
| `/members/` | メンバー | 03 | `src/pages/members/index.astro` | `members-view.html` |
| `/blog/` | 活動日誌 一覧 | 04 | `src/pages/blog/index.astro` | `journal-view.html` |
| `/blog/<slug>/` | 活動日誌 記事 | — | `src/pages/blog/[...slug].astro` | （既存レイアウトを流用） |
| `/contact/` | お問い合わせ | 05 | `src/pages/contact/index.astro` | `contact-view.html` |
| `/rss.xml` | RSS | — | `src/pages/rss.xml.js` | — |
| `/sitemap-index.xml` | サイトマップ | — | `@astrojs/sitemap` が自動生成 | — |

### 階層

```
/
├── /services/
│   └── /services/experience-learning/
├── /organization/
├── /members/
├── /blog/
│   └── /blog/<slug>/
└── /contact/
```

---

## 3. 個別の判断

### 事業詳細を `/services/` 配下に置く理由

体験型学習プロジェクトは**事業01の詳細**であり、独立した第一階層のコンテンツではない。`/projects/` という別系統を作ると、事業一覧との親子関係がURLから読み取れなくなる。

パンくずとページ末の送りもこの階層に従う。

```
LinkFarm Tech. ／ 事業内容 ／ 体験型学習プロジェクト
```

事業詳細ページの末尾は「事業内容の一覧へ戻る」であり、トップへは戻さない。戻り先は親ページが正しい。

### 事業02・03に詳細ページを作らない理由

現時点で詳細を書くだけの内容がない。**中身のないページを作らない。** 一覧に載せた3点の箇条書きで足りる。

将来 02 や 03 に詳細が必要になった場合は、同じ規則で `/services/<slug>/` に追加する。そのとき一覧側の「事業の詳細を見る →」を有効にすればよい。

### 活動日誌の URL を `/blog/` のまま維持する理由

UIラベルは「活動日誌」だが、**URLは `/blog/` を変えない。**

- 既存記事の `/blog/<slug>/` が外部（NARATIVE様の関係先、補助金の報告、SNS）から参照されている可能性がある
- `/journal/` に変えると6件すべての記事URLが変わり、リダイレクト設定が必要になる
- Firebase Hosting でのリダイレクトは設定可能だが、得られるものが「URLの語感」だけでは割に合わない

**URLの見た目より、既存リンクが切れないことを優先する。**

### 記事の slug

記事の frontmatter に `slug` が定義されている（例：`student-subsidly-success`）。ファイル名（`20260627_hojokin-saitaku.md`）ではなく、この `slug` が URL になる。

> `student-subsidly-success` は `subsidy` の綴り違いと思われるが、**既に公開済みのURLなので修正しない。** 修正するとリンクが切れる。新規記事では綴りに注意すること。

### お問い合わせページにフォームを置かない

窓口は `office@linkfarm-tech.com` のみ。[01-overview.md](./01-overview.md) の通り、2名体制で個人情報を預かる責任を負わない。

ページには `mailto:` のボタンと、連絡先・相談の例を定義リストで置く。

---

## 4. 旧URLからの移行

旧構成のアンカーリンクは、外部から参照されている可能性がある。

| 旧 | 新 | 対応 |
|---|---|---|
| `/#problem` | `/services/experience-learning/#problem` | フラグメントなのでサーバー側の処理は不要。`/` に着地する |
| `/#cycle` | `/services/experience-learning/#cycle` | 同上 |
| `/#features` | `/services/experience-learning/#features` | 同上 |
| `/#schedule` | `/services/experience-learning/#schedule` | 同上 |
| `/#team` | `/members/` | 同上 |
| `/#contact` | `/contact/` | 同上 |
| `/blog/` | `/blog/` | 変更なし |
| `/blog/<slug>/` | `/blog/<slug>/` | 変更なし |

**フラグメント（`#`）はサーバーに送られないため、旧アンカーURLはすべて `/` に着地する。** 404 にはならないので、リダイレクト設定は不要と判断する。トップが目次になっているため、着地後に目的のページへ進める。

**実URLの変更は1件もない。** これがこの移行の重要な性質であり、`/blog/` を維持する判断と合わせて、外部リンクは1本も切れない。

---

## 5. ナビゲーション

### グローバルナビ（ヘッダー）

```
[ロゴ]        事業内容  団体概要  メンバー  活動日誌  [お問い合わせ]
```

- 現在のページに `aria-current="page"` を付け、焦茶の下線で示す
- 事業詳細ページでは「事業内容」を現在地として扱う（親を示す）
- 1000px 未満ではハンバーガーメニューに畳む

### パンくず

トップ以外の全ページに置く。区切りは `／`（全角スラッシュ）。

```
LinkFarm Tech. ／ 事業内容 ／ 体験型学習プロジェクト
```

### ページ末の送り（`.nextpage`）

下層ページの末尾に、次の節への送りを置く。目次に戻らずに読み進められるようにするため。

```
/organization/  → § 03 メンバーを見る
/members/  → § 04 活動日誌を読む
/blog/     → § 05 お問い合わせへ
```

`/services/` と `/contact/` には送りを置かない。前者は詳細ページへの分岐があり、後者は終端であるため。

### フッター

全ページ共通。メニューには事業詳細ページも含める（ヘッダーには入らないため、ここが唯一の直接導線になる）。

---

## 6. メタデータ

### `<title>`

| ページ | `<title>` |
|---|---|
| `/` | `LinkFarm Tech. Official HP` |
| その他 | `<ページ名> — LinkFarm Tech.` |

定数は `src/consts.ts` の `SITE_TITLE_FULL`（トップ専用）と `SITE_TITLE`（団体名）に分けてある。**`SITE_TITLE` はロゴの `alt` とコピーライトにも使われている**ので、こちらを「Official HP」付きに変えてはいけない。

### 構造化データ（JSON-LD）

| ページ | 型 |
|---|---|
| `/` | `Organization`（`founder` に代表者2名） |
| `/blog/<slug>/` | `BlogPosting` + `BreadcrumbList`（`src/utils/schema.ts` が生成） |
| その他 | `BreadcrumbList` |

`src/utils/schema.ts` の `generateBlogPostSchema` が生成する `BreadcrumbList` は「ホーム → 活動日誌 → 記事」の3段構成。これは新しいURL構成でも変わらない。

### サイトマップ

`@astrojs/sitemap` が全ページを自動収集する。`site: 'https://linkfarm-tech.com'` が設定済み。

### RSS

`/rss.xml` は活動日誌のみを対象とする。事業ページや団体概要は含めない。

---

## 関連ドキュメント

- [01-overview.md](./01-overview.md) — 背景と役割
- [02-design.md](./02-design.md) — デザイン規則
- [04-web.md](./04-web.md) — 採用技術とコーディングルール
