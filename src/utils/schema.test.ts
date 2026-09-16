import { describe, it, expect } from 'vitest';
import { generateBlogPostSchema } from './schema';

const SITE = 'https://linkfarm-tech.com/';
const URL_ = 'https://linkfarm-tech.com/blog/student-subsidly-success/';

const base = {
  title: '2026年度 奈良市 学生補助金 採択決定しました！',
  description: '補助金申請業務、ついに採択という形で幕を閉じました！',
  pubDate: new Date('2026-06-27T00:00:00Z'),
  url: URL_,
  siteUrl: SITE,
};

describe('generateBlogPostSchema', () => {
  it('BlogPosting と BreadcrumbList の2件を @graph に返す', () => {
    const schema = generateBlogPostSchema(base);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@graph']).toHaveLength(2);
    expect(schema['@graph'][0]['@type']).toBe('BlogPosting');
    expect(schema['@graph'][1]['@type']).toBe('BreadcrumbList');
  });

  it('日付を ISO 8601 に変換する', () => {
    const schema = generateBlogPostSchema(base);
    const post = schema['@graph'][0];

    expect(post.datePublished).toBe('2026-06-27T00:00:00.000Z');
  });

  it('updatedDate がなければ dateModified を持たない', () => {
    const schema = generateBlogPostSchema(base);

    expect(schema['@graph'][0]).not.toHaveProperty('dateModified');
  });

  it('updatedDate があれば dateModified に反映する', () => {
    const schema = generateBlogPostSchema({
      ...base,
      updatedDate: new Date('2026-07-01T09:00:00Z'),
    });

    expect(schema['@graph'][0].dateModified).toBe('2026-07-01T09:00:00.000Z');
  });

  it('heroImage をサイトURL基準の絶対URLに解決する', () => {
    const schema = generateBlogPostSchema({
      ...base,
      heroImage: { src: '/_astro/hojokin.png' },
    });

    expect(schema['@graph'][0].image).toEqual([
      'https://linkfarm-tech.com/_astro/hojokin.png',
    ]);
  });

  it('tags を keywords のカンマ区切り文字列にする', () => {
    const schema = generateBlogPostSchema({
      ...base,
      tags: ['補助金', '資金調達'],
    });

    expect(schema['@graph'][0].keywords).toBe('補助金, 資金調達');
  });

  it('tags が空配列なら keywords を持たない', () => {
    const schema = generateBlogPostSchema({ ...base, tags: [] });

    expect(schema['@graph'][0]).not.toHaveProperty('keywords');
  });

  it('パンくずを ホーム → 活動日誌 → 記事 の3段で組む', () => {
    const crumbs = generateBlogPostSchema(base)['@graph'][1].itemListElement;

    expect(crumbs.map((c: { name: string }) => c.name)).toEqual([
      'ホーム',
      '活動日誌',
      base.title,
    ]);
    expect(crumbs.map((c: { position: number }) => c.position)).toEqual([1, 2, 3]);
    expect(crumbs[1].item).toBe('https://linkfarm-tech.com/blog');
    expect(crumbs[2].item).toBe(URL_);
  });

  it('siteUrl が未指定なら記事URLを基準に解決する', () => {
    const { siteUrl: _omitted, ...withoutSite } = base;
    const schema = generateBlogPostSchema(withoutSite);

    expect(schema['@graph'][0].publisher.logo.url).toBe(
      'https://linkfarm-tech.com/blog/student-subsidly-success/favicon.svg',
    );
  });
});
