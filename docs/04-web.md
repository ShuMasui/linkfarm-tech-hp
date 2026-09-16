# 04. 採用技術とコーディングルール

このリポジトリで使う技術、ディレクトリ構成、検査の仕組みを定義する。

コーディング規約の本体は既存の [RULE.md](../RULE.md) にある。本ドキュメントはそれを置き換えるものではなく、**技術選定の理由と、検査・ビルドの実行方法**を記録する。

---

## 1. 採用技術

| 分類 | 技術 | バージョン | 役割 |
|---|---|---|---|
| フレームワーク | [Astro](https://astro.build/) | ^6.4.5 | 静的サイト生成 |
| スタイル | [Tailwind CSS](https://tailwindcss.com/) | ^4.3.0 | デザイントークンとユーティリティ（`@tailwindcss/vite` 経由） |
| コンテンツ | `@astrojs/mdx` | ^6.0.3 | 記事の Markdown / MDX |
| 画像 | [sharp](https://sharp.pixelplumbing.com/) | ^0.34.3 | ビルド時の画像最適化 |
| SEO | `@astrojs/sitemap` / `@astrojs/rss` | — | サイトマップ・RSS |
| 型検査 | `@astrojs/check` + `typescript` | — | `astro check` |
| テスト | [Vitest](https://vitest.dev/) | ^5 | 単体テスト |
| ホスティング | Firebase Hosting | — | `dist/` を配信 |
| CI/CD | GitHub Actions | — | main への push で自動ビルド・デプロイ |

Node.js は **22.12.0 以上**（`package.json` の `engines` で指定）。

### Astro を使っている理由

このサイトは全ページが静的で、動的な機能を持たない（フォームもログインもない）。ビルド時にHTMLを吐き切れることが要件に対して最も素直であり、JavaScript をクライアントに送る必要がほとんどない。

### Tailwind v4 の組み込み

**PostCSS 経由ではなく Vite プラグイン（`@tailwindcss/vite`）で通している。** v4 公式が推奨する経路で、PostCSS より速く Astro の Vite に直結する。`postcss.config.mjs` と `@tailwindcss/postcss` / `postcss` は不要になったので削除した。

```js
// astro.config.mjs
import tailwindcss from '@tailwindcss/vite';
vite: { plugins: [tailwindcss()] }
```

CDN からは一切読み込まない（すべて npm + ビルド時コンパイル）。

### デザイントークンは `@theme` に一本化

色・書体・紙面の寸法はすべて `src/styles/global.css` の **`@theme static`** ブロックにある。ここが唯一の定義元で、同じ値を他の場所に書かない。

```css
@theme static {
  --color-washi:   #faf8f2;
  --color-wheat:   #f5deb3;
  --color-sumi:    #3d2b1f;
  --color-sumi-50: rgba(61, 43, 31, .50);
  --font-display:  "WDXL Lubrifont JP N", ...;
  --sheet: 1180px;
}
```

`static` を付けているのは、**未使用のトークンが tree-shaking で消えるのを防ぐため**。コンポーネントCSSから `var(--color-sumi-50)` のように参照するので、ユーティリティとして使われていなくても出力に残す必要がある。

この命名にしたことで、`bg-wheat` `text-sumi` `border-sumi-18` `font-display` といった **Tailwind のユーティリティがそのまま使える**ようになっている。

### コンポーネントのCSSは名前付きクラスで持つ

**見た目の規則は Tailwind のユーティリティの寄せ集めではなく、`global.css` の名前付きクラスで持っている。**

モック（`docs/mocks/mock.css`）を素の CSS として書き、それをほぼそのまま移植した。ユーティリティへ翻訳し直すと、モックとの視覚的な一致を保証できなくなり、翻訳の過程で必ずずれが生じるため。[02-design.md](./02-design.md) が「実装の正典はモック」と宣言しているのは、この構造を指している。

`clamp()` による流動サイズ、`writing-mode: vertical-rl`、`box-decoration-break`、名前付きエリアのグリッド、`repeating-linear-gradient` の点線、`feTurbulence` のデータURI など、ユーティリティに素直な対応物がない規則が多いことも理由のひとつ。

**新しい見た目の規則を足すときは、`global.css` に名前付きクラスとして書く。** 個別の微調整はページの scoped `<style>` に置く。

#### コンポーネントのクラス名を Tailwind のユーティリティ名と被せない

**Tailwind v4 はソースを走査して、見つけたクラス名に対応するユーティリティを生成する。** コンポーネント用に付けた名前がユーティリティ名と一致すると、Tailwind 側の宣言が生成され、こちらが上書きしていないプロパティはそのまま効いてしまう。

実際に踏んだ例：目次の節に `class="section contents"` と付けたところ、Tailwind が `.contents { display: contents }` を生成し、**セクションのボックスごと消えて padding が一切効かなくなった**（`toc-section` に改名して解決）。

`@import "tailwindcss"` が先頭にあるためユーティリティが先に来るが、こちらが宣言していないプロパティ（この場合 `display`）には勝てない。

避けるべき名前の例：`contents` `block` `flex` `grid` `table` `hidden` `visible` `fixed` `absolute` `relative` `sticky` `static` `container` `isolate` `inline`。**レイアウトの語をそのままクラス名にしない。**

衝突の検査は、ビルド後CSSから自前のクラス名に対する単一プロパティ宣言を拾えば機械的にできる。

#### 子コンポーネントに scoped style は届かない

Astro のスコープ付きスタイルは、`<style>` を書いたコンポーネントのテンプレート内の要素にしか適用されない。`Plate` のような子コンポーネントが描画する要素は対象外になり、**ビルド後の CSS から黙って消える。**

この罠は2回踏んだ。

| 症状 | 原因 |
|---|---|
| 表紙の写真が元の縦横比のまま巨大に出た | `index.astro` の scoped style に `.cover__plate img` を書いていた |
| 記事の写真だけ本文より広く（紙面いっぱいに）出た | `BlogPost.astro` の scoped style に `.postplate` を書いていた |

**`Plate` に `class` を渡してサイズを効かせたいときは、必ず `global.css` に書く。** 現在 `.cover__plate` `.door__plate` `.postplate` の3つがそこにある。

判別法：`<Plate class="foo">` のように**クラスを prop として子に渡している**なら、そのクラスへの指定は scoped では効かない。

---

## 2. ディレクトリ構成

```
├── docs/                  ← 設計ドキュメント（このファイル群）
│   └── mocks/             ← デザインモック（実装の正典）
├── public/                ← そのまま配信される静的ファイル
├── src/
│   ├── assets/            ← ビルド時に最適化される画像・フォント
│   │   ├── hero/          ← 現場写真
│   │   └── blogshero/     ← 記事のヒーロー画像
│   ├── components/        ← Astro コンポーネント（UIのみ）
│   ├── content/blog/      ← 記事の Markdown / MDX
│   ├── layouts/           ← ページレイアウト
│   ├── pages/             ← ルーティング（→ 03-route.md）
│   ├── styles/global.css  ← デザイントークンと基底スタイル
│   ├── utils/             ← ピュアな TypeScript（テスト対象）
│   ├── consts.ts          ← サイト全体の定数
│   └── content.config.ts  ← コンテンツコレクションのスキーマ
├── Makefile               ← 開発タスク
├── vitest.config.ts       ← テスト設定
└── astro.config.mjs       ← Astro 設定
```

### ビューとロジックの分離

**`src/utils/` にあるものだけがテスト対象になる。**

[RULE.md](../RULE.md) の方針通り、データ加工・日付整形・条件分岐を含むロジックは `.astro` の中に書かず、ピュアな TypeScript 関数として `src/utils/` に切り出す。`.astro` は HTML 構造・Tailwind によるスタイリング・Props の受け取りだけを担う。

現在の例：`src/utils/schema.ts`（JSON-LD の生成）とその隣の `schema.test.ts`。

---

## 3. 開発タスク（Makefile）

```sh
make            # タスク一覧
make install    # 依存をロックファイル通りに入れる（npm ci）
make dev        # 開発サーバー
make lint       # 型とテンプレートの検査（astro check）
make test       # 単体テスト（vitest run）
make test-watch # テストの監視実行
make build      # 本番ビルド → dist/
make preview    # ビルド済み dist/ の確認
make check      # lint → test → build を順に通す
make clean      # dist/ と .astro/ を削除
```

`npx --no-install` を使っているため、**依存が入っていない状態では失敗する**。先に `make install` を実行すること。これは意図的で、ネットワークからの暗黙のダウンロードを防いでいる。

### `make lint` が検査するもの

`astro check` は、`.astro` ファイルのテンプレートと TypeScript を検査する。

- 型エラー（`tsconfig.json` は `astro/tsconfigs/strict` + `strictNullChecks`）
- 未定義の Props、存在しないプロパティへの参照
- Astro 固有の記述ミス（ディレクティブの付け忘れなど）

**errors / warnings / hints のいずれも0であることを維持する。** hints も含めて0にしておくことで、新しく出た指摘に気づける。

> ESLint と Prettier は導入していない。`astro check` が型と構造を押さえており、2名体制でフォーマット論争のコストを払う段階にないため。将来コントリビューターが増えたら再検討する。

### `make test` が検査するもの

`src/**/*.{test,spec}.ts` を Vitest で実行する（`vitest.config.ts`）。

`.astro` コンポーネントのレンダリングテストは対象外。UIの確認はモックとブラウザで行い、テストは**ロジックの正しさだけ**を見る。

---

## 4. 画像の扱い

### Astro の `<Image>` を使う

`src/assets/` 配下の画像は `import` して `<Image>` に渡す。ビルド時に WebP へ変換され、ファイル名にハッシュが付く。`public/` に置いた画像は最適化されないため、favicon など例外的なものだけに限る。

### EXIF 回転の正規化（対応済み）

現場写真に EXIF の回転情報が入っていたため、**向きを焼き込んで置き換え済み**。

| ファイル | 対応前 | 対応後 |
|---|---|---|
| `hero-01.jpg` | 1567×1045 / EXIF なし | 変更なし（86KB に再圧縮） |
| `hero-02.jpg` | 4000×3000 / orientation=3 / 5.7MB | 2400×1800 / 1.2MB |
| `hero-03.jpg` | 4000×3000 / orientation=6 / 3.5MB | 1800×2400 / 522KB |

**新しい写真を追加するときも、必ず同じ正規化を通すこと。** sharp の `.rotate()` は引数なしで呼ぶと EXIF に従って回転し、その際に EXIF を落とす。

```sh
node -e "
const sharp=require('sharp');
sharp('src/assets/hero/NEW.jpg')
  .rotate()                                  // EXIF に従って回転し、EXIF を落とす
  .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('src/assets/hero/NEW.tmp.jpg');
" && mv src/assets/hero/NEW.tmp.jpg src/assets/hero/NEW.jpg
```

### フォント

**Google Fonts からダウンロードして、リポジトリに取り込んである。** 実行時はもちろん、ビルド時にも外部へ取りに行かない。

| | |
|---|---|
| 実体 | `public/fonts/*.woff2`（486ファイル / 6.5MB）→ `/fonts/` で配信 |
| `@font-face` | `src/styles/fonts.css`（自動生成・手で編集しない） |
| 取り込み直し | `make fonts`（`scripts/fetch-fonts.mjs`） |

| 書体 | 用途 | ウェイト |
|---|---|---|
| WDXL Lubrifont JP N | 見出し（`--display`） | 400のみ |
| Zen Kaku Gothic New | 本文・UI（`--gothic`） | 400 / 500 / 700 |

#### なぜ Astro の Fonts API を使わないか

`fontProviders.google()` はビルド時にフォントを取得して自サイト配信してくれるが、**`@font-face` を各ページの `<style>` にインライン展開する**。日本語フォントは `unicode-range` で123分割されるため定義が486個になり、1ページあたり375KBがインラインで乗る。しかもインラインなのでページごとに再送され、キャッシュが効かない。

`src/styles/fonts.css` は `global.css` から `@import` しているため、ビルド時に**外部CSS 1本にまとまり全ページで共有キャッシュされる**。`astro.config.mjs` の `build.inlineStylesheets: 'never'` がこれを保証している。

| | brotli後 |
|---|---|
| Astro Fonts API（インライン） | 28.4 KB **× ページ数** |
| 現在（外部CSS） | ページ 3.3 KB ＋ 共有CSS 25.7 KB **× 1回** |

フォントの実体は `unicode-range` で分割されたままなので、閲覧者が落とすのは使われた文字を含むチャンクだけ。

> 元テンプレート由来の Atkinson はどのスタイルからも参照されていなかったため、読み込みをやめた。ファイルは `src/assets/fonts/` に残してある。

### ロゴ

`src/assets/linkfarm-logo-yoko.png` が正のアセット。**このファイルには手を加えない。**
焦茶版の派生画像を使う方針と、その理由は [02-design.md](./02-design.md) の 9節を参照。

---

## 5. コンテンツ（記事）

### frontmatter

スキーマは `src/content.config.ts` で定義されている。

```yaml
---
title: "記事タイトル"
description: "一覧とOGPに出る説明"
pubDate: "2026-06-27"
heroImage: "../../assets/blogshero/xxx.png"
slug: "url-becomes-this"
tags: "タグ1, タグ2, タグ3"
---
```

- `tags` は**カンマ区切りの文字列**で書く。スキーマ側で配列に変換される
- `slug` が URL になる。ファイル名は URL に影響しない
- `heroImage` は `src/assets/` からの相対パス。省略可

### 公開済み slug は変更しない

外部からのリンクが切れるため。詳細は [03-route.md](./03-route.md)。

---

## 6. CI/CD

`.github/workflows/build-test-and-deploy.yml` が main への push で動く。3ジョブの直列。

```
check  → npm ci → make check（lint → test → build）
   ↓ needs
build  → npm ci → npm run build → dist/ を artifact に上げる
   ↓ needs
deploy → artifact を取得 → Workload Identity で GCP 認証 → Firebase Hosting へデプロイ
```

**`check` が落ちれば build も deploy も走らない。** 型エラーやテストの失敗が main に入ったまま公開されることを防ぐための門で、ローカルの `make check` と同じ内容を実行する。

認証は Workload Identity 連携を使っており、サービスアカウントキーをリポジトリに置いていない。`WORKLOAD_IDENTITY_PROVIDER` と `SERVICE_ACCOUNT` は GitHub Secrets に設定済み。

> **既知の無駄** — `make check` の最後で astro build が走るため、`build` ジョブと合わせてビルドが2回実行される。ビルド自体は2秒程度なので実害は小さく、ジョブ名 `build` を保つほうを優先した（ブランチ保護の必須チェックがジョブ名を参照している場合に壊さないため）。
> ビルドを1回に減らすなら、`check` ジョブに artifact のアップロードを持たせて `build` ジョブを削り、`deploy` の `needs` を `check` に向ける。

---

## 7. ローカルでモックを見る

モックは素の HTML なので、`docs/mocks/*.html` を直接ブラウザで開けば表示される。
相対パスで `src/assets/` の画像を参照しているため、リポジトリの構造を保ったまま開くこと。

HTTP 経由で確認したい場合：

```sh
python3 -m http.server 8765
# → http://localhost:8765/docs/mocks/web-view.html
```

---

## 関連ドキュメント

- [01-overview.md](./01-overview.md) — 背景と役割
- [02-design.md](./02-design.md) — デザイン規則
- [03-route.md](./03-route.md) — ルート戦略
- [../RULE.md](../RULE.md) — コーディング規約の本体
