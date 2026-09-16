// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';


// https://astro.build/config
export default defineConfig({
  site: 'https://linkfarm-tech.com',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],

  build: {
    // 日本語フォントは unicode-range で123分割されるため、@font-face が
    // 487個になる。既定の 'auto' だとこれが全ページの <style> に
    // インライン展開され、1ページあたり375KB（brotli後28KB）を
    // ページ数ぶん再送することになる。
    // 外部CSSに出すと初回の1回だけダウンロードされ、以降は
    // 全ページで共有キャッシュされる。
    inlineStylesheets: 'never',
  },

  // フォント設定は持たない。
  // 見出し・本文は public/fonts/ の静的ファイルを src/styles/fonts.css で
  // 読んでいる（make fonts で取り込み直す）。
  // 元テンプレート由来の Atkinson はどのスタイルからも参照されていないため
  // 読み込みをやめた。ファイルは src/assets/fonts/ に残してある。

  vite: {
    plugins: [],
  },
});