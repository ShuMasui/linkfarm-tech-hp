// サイト全体で使う定数。文言の表記ゆれを防ぐため、
// ナビとフッターのメニューはここ1箇所から供給する。
// 用語の統一規則は docs/01-overview.md 第6節を参照。

/** 団体名。ロゴの alt、コピーライト、各ページの <title> の接尾に使う */
export const SITE_TITLE = 'LinkFarm Tech.';

/**
 * トップページの <title>。ブラウザのタブと検索結果に出る名前。
 * 団体名そのものではないので SITE_TITLE とは分けている
 * （SITE_TITLE をこれに変えると、ロゴの alt やコピーライトまで
 *   「LinkFarm Tech. Official HP」になってしまう）
 */
export const SITE_TITLE_FULL = 'LinkFarm Tech. Official HP';
export const SITE_DESCRIPTION =
  '奈良の耕作放棄地を舞台にした体験型学習プログラムの企画・運営と、提携農家様と学生をつなぐ連携、そして地域の活動を支えるWeb制作。農業とテクノロジーのあいだにある距離を縮める学生団体です。';

export const CONTACT_EMAIL = 'office@linkfarm-tech.com';
/** スパム収集を避けるための表示用表記 */
export const CONTACT_EMAIL_MASKED = 'office[A]linkfarm-tech.com（[A]を@に変えてください）';

export const SUBSIDY = '2026年度 奈良市 産学官連携プラットフォーム 補助金 採択事業';

/** グローバルナビ。key は現在地の判定に使う */
export const NAV = [
  { key: 'services',     label: '事業内容', href: '/services/' },
  { key: 'organization', label: '団体概要', href: '/organization/' },
  { key: 'members',      label: 'メンバー', href: '/members/' },
  { key: 'journal',      label: '活動日誌', href: '/blog/' },
] as const;

export const CONTACT_NAV = { key: 'contact', label: 'お問い合わせ', href: '/contact/' } as const;

/** フッターのメニュー。ヘッダーに載らない事業詳細もここに含める */
export const FOOT_MENU = [
  { label: '事業内容',             href: '/services/' },
  { label: '体験型学習プロジェクト', href: '/services/experience-learning/' },
  { label: '団体概要',             href: '/organization/' },
  { label: 'メンバー',             href: '/members/' },
  { label: '活動日誌',             href: '/blog/' },
  { label: 'お問い合わせ',          href: '/contact/' },
] as const;

export type NavKey = (typeof NAV)[number]['key'] | 'contact' | 'home';
