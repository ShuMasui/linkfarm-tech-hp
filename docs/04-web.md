# 04. 採用技術とコーディングルール

このリポジトリで使う技術、ディレクトリ構成、検査の仕組みを定義する。

コーディング規約の本体は既存の [RULE.md](../RULE.md) にある。本ドキュメントはそれを置き換えるものではなく、**技術選定の理由と、検査・ビルドの実行方法**を記録する。

---

## 1. 採用技術

| 分類 | 技術 | バージョン | 役割 |
|---|---|---|---|
| フレームワーク | [Astro](https://astro.build/) | ^6.4.5 | 静的サイト生成 |
| スタイル | [Tailwind CSS](https://tailwindcss.com/) | ^4.3.0 | ユーティリティCSS（`@tailwindcss/postcss` 経由） |
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

### Tailwind 4 と設計トークンの関係

デザイントークンは `src/styles/global.css` の `@theme` ブロックに定義する。[02-design.md](./02-design.md) の色・書体はすべてここに集約し、コンポーネント側でハードコードしない。

```css
@theme {
  --color-washi: #faf8f2;
  --color-wheat: #f5deb3;
  --color-sumi:  #3d2b1f;
  /* … */
}
```

> **注意** — 旧トークン（`--color-brand-primary` などの indigo / emerald / orange）は新デザインで全廃する。削除する前に、参照している箇所をすべて置き換えること。

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

### EXIF 回転の正規化（未対応・要実施）

現場写真に EXIF の回転情報が入っている。

| ファイル | orientation | 実サイズ | ファイルサイズ |
|---|---|---|---|
| `hero-01.jpg` | なし | 1567×1045 | 111KB |
| `hero-02.jpg` | **3（180°）** | 4000×3000 | **5.7MB** |
| `hero-03.jpg` | **6（90°）** | 4000×3000（実質 3000×4000） | 3.5MB |

**生のピクセルは回転前の向きで保存されている。** ブラウザは EXIF を尊重するのでモックでは正しく表示されるが、ビルド時の最適化で向きが崩れる可能性がある。

実装時に、向きを焼き込んだファイルへ正規化すること。sharp の `.rotate()` は引数なしで呼ぶと EXIF に従って回転し、その際に EXIF を落とす。

```sh
# 例：向きを焼き込み、長辺2400pxに縮小して上書きする
node -e "
const sharp=require('sharp');
sharp('src/assets/hero/hero-02.jpg')
  .rotate()
  .resize({ width: 2400, withoutEnlargement: true })
  .jpeg({ quality: 82 })
  .toFile('src/assets/hero/hero-02.normalized.jpg');
"
```

5.7MB の元ファイルをリポジトリに残す必要はないので、正規化と同時に置き換えてよい。

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

`.github/workflows/build-test-and-deploy.yml` が main への push で動く。

```
build  → npm ci → npm run build → dist/ を artifact に上げる
deploy → artifact を取得 → Workload Identity で GCP 認証 → Firebase Hosting へデプロイ
```

認証は Workload Identity 連携を使っており、サービスアカウントキーをリポジトリに置いていない。`WORKLOAD_IDENTITY_PROVIDER` と `SERVICE_ACCOUNT` は GitHub Secrets に設定済み。

> **未対応** — 現在のワークフローは `npm run build` しか実行していない。`make check` と同じ内容（lint → test → build）を通すよう更新すると、型エラーやテストの失敗が main に入るのを防げる。ジョブ名が `build` なので、ステップを追加するだけでよい。

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
