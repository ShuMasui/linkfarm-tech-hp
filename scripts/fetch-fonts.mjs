#!/usr/bin/env node
/**
 * Google Fonts から woff2 を全てダウンロードし、自サイト配信用に取り込む。
 *
 *   出力先: public/fonts/*.woff2      … 実体（そのまま /fonts/ で配信される）
 *           src/styles/fonts.css      … @font-face 定義（global.css から import）
 *
 * なぜ Astro の Fonts API を使わないか:
 *   日本語フォントは unicode-range で123分割されるため @font-face が数百個になる。
 *   Astro の <Font> はそれを各ページの <style> にインライン展開するので、
 *   ページごとに 375KB（brotli後 28KB）を再送することになりキャッシュが効かない。
 *   ここで生成した CSS は global.css に取り込まれて外部ファイルになるため、
 *   初回の1度だけダウンロードされ、以降は全ページで共有キャッシュされる。
 *
 * 実行:  make fonts
 * フォントを差し替えたいときは FAMILIES を書き換えて再実行する。
 */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const FAMILIES = [
  { slug: 'wdxl',    css: 'WDXL+Lubrifont+JP+N',              name: 'WDXL Lubrifont JP N' },
  { slug: 'zenkaku', css: 'Zen+Kaku+Gothic+New:wght@400;500;700', name: 'Zen Kaku Gothic New' },
];

// woff2 を返させるための UA。古い UA だと ttf になる
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const FONT_DIR = 'public/fonts';
const CSS_OUT = 'src/styles/fonts.css';

/** 同時接続を絞る。数百ファイルを一斉に取りにいくと落とされる */
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

async function fetchWithRetry(url, opts = {}, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i === tries) throw new Error(`${url} の取得に失敗: ${err.message}`);
      await new Promise((r) => setTimeout(r, 400 * i));
    }
  }
}

/** Google の CSS から @font-face を切り出す */
function parseFaces(css) {
  const faces = [];
  for (const block of css.match(/@font-face\s*\{[^}]*\}/g) ?? []) {
    const url = block.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1] ?? '400';
    const style = block.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal';
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim();
    if (url && range) faces.push({ url, weight, style, range });
  }
  return faces;
}

async function main() {
  await rm(FONT_DIR, { recursive: true, force: true });
  await mkdir(FONT_DIR, { recursive: true });

  const chunks = [];
  let total = 0;

  for (const family of FAMILIES) {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family.css}&display=swap`;
    const css = await (await fetchWithRetry(cssUrl, { headers: { 'User-Agent': UA } })).text();
    const faces = parseFaces(css);
    console.log(`${family.name}: @font-face ${faces.length} 件`);

    const written = await pool(faces, 8, async (face, i) => {
      const file = `${family.slug}-${face.weight}-${i}.woff2`;
      const buf = Buffer.from(await (await fetchWithRetry(face.url)).arrayBuffer());
      await writeFile(join(FONT_DIR, file), buf);
      total += buf.length;
      return { ...face, file, family: family.name };
    });

    chunks.push(...written);
  }

  const header = `/* 自動生成: scripts/fetch-fonts.mjs
 * 手で編集しない。フォントを差し替えるときは make fonts を実行する。
 * 実体は public/fonts/ にあり、/fonts/ から配信される。
 * このファイルは global.css に取り込まれて外部CSSになるので、
 * 全ページで共有キャッシュされる。
 */\n\n`;

  const body = chunks
    .map(
      (c) => `@font-face {
  font-family: '${c.family}';
  font-style: ${c.style};
  font-weight: ${c.weight};
  font-display: swap;
  src: url('/fonts/${c.file}') format('woff2');
  unicode-range: ${c.range};
}`,
    )
    .join('\n');

  await writeFile(CSS_OUT, header + body + '\n');

  const mb = (total / 1024 / 1024).toFixed(1);
  console.log(`\n${chunks.length} ファイル / ${mb} MB を ${FONT_DIR} に取り込みました`);
  console.log(`@font-face 定義を ${CSS_OUT} に書き出しました`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
