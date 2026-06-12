# LinkFarm Tech LP 開発ガイドライン (RULE.md)

本ドキュメントは、LinkFarm Tech LP（ホームページ）プロジェクトにおいて、高品質で保守しやすいコードベースを維持し、チーム開発や長期的な運用を円滑にするためのガイドラインです。本ガイドラインでは、**TDD（テスト駆動開発）の考え方**を設計の根底に据え、具体的な命名規則やコーディング規約を定めます。

---

## 1. TDD（テスト駆動開発）とテスト容易設計の考え方

本プロジェクトでは、現時点でテストフレームワーク（Vitest等）を導入していませんが、**「将来テストコードを書くことを前提とした設計」**を徹底します。これにより、コードの密結合を防ぎ、保守性と信頼性を高めます。

### 1.1 ビュー（UI）とロジックの分離
AstroコンポーネントやHTMLテンプレートの中に、データ処理や複雑な計算ロジックを直接埋め込むことは避けてください。
- **UI（プレゼンテーション）**: Astroコンポーネント (`.astro`) はHTML構造の定義とTailwind CSSによるスタイリング、Propsの受け取りのみを担当します。
- **ロジック（ビジネスロジック・計算）**: データのフィルタリング、日付フォーマット、条件に応じたテキスト生成などは、ピュアなTypeScript関数として `src/utils/` や `src/logic/` などの独立したファイルに切り出します。

#### ❌ 悪い例（UIとロジックの混在）
```astro
---
// src/components/BadComponent.astro
interface Props {
  rawDate: string;
  items: Array<{ name: string; status: 'active' | 'inactive' }>;
}
const { rawDate, items } = Astro.props;

// 複雑なデータ加工ロジックがコンポーネント内にあるため、テストが困難
const formattedDate = new Date(rawDate).toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const activeItems = items.filter(item => item.status === 'active');
---
<div>
  <p>日付: {formattedDate}</p>
  <ul>
    {activeItems.map(item => <li>{item.name}</li>)}
  </ul>
</div>
```

#### ⭕ 良い例（ロジックの分離）
```typescript
// src/utils/format.ts
export function formatDate(rawDate: string): string {
  return new Date(rawDate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// src/utils/filter.ts
export interface Item {
  name: string;
  status: 'active' | 'inactive';
}
export function getActiveItems(items: Item[]): Item[] {
  return items.filter(item => item.status === 'active');
}
```

```astro
---
// src/components/GoodComponent.astro
import { formatDate } from '../utils/format';
import { getActiveItems } from '../utils/filter';
import type { Item } from '../utils/filter';

interface Props {
  rawDate: string;
  items: Item[];
}
const { rawDate, items } = Astro.props;

const formattedDate = formatDate(rawDate);
const activeItems = getActiveItems(items);
---
<div>
  <p>日付: {formattedDate}</p>
  <ul>
    {activeItems.map(item => <li>{item.name}</li>)}
  </ul>
</div>
```

### 1.2 TDD（テスト駆動）開発プロセス
新規ロジックやユーティリティを作成する際は、以下のステップを意識します。
1. **仕様定義（インターフェースの決定）**: 作成する関数のシグネチャ（引数と返り値の型）を定義する。
2. **期待値の整理（擬似的なテスト検討）**: 「入力がAのとき、出力はBになる」というパターンを書き出す。
3. **実装**: 定義したインターフェースに沿って関数を実装し、整理した期待値を満たすか検証する。
4. **リファクタリング**: コードの可読性や効率を向上させる。

### 1.3 将来的なテスト環境 (Vitest / Playwright)
テストを導入する際は以下の役割分担で行います。
- **ユニットテスト (Vitest)**: `src/utils/` や `src/logic/` 配下のピュア関数のロジック検証。
- **E2Eテスト / VRT (Playwright)**: ユーザーインタラクション（フォーム入力、ナビゲーション、スクロールイベント）や視覚的なレイアウト崩れの検証。

---

## 2. 命名規則 (Naming Conventions)

コードベースの統一性を保ち、直感的にファイルや変数の役割を理解できるように命名規則を厳守します。

### 2.1 ディレクトリおよびファイル命名
| 対象 | 命名規則 | 例 |
| :--- | :--- | :--- |
| **Astroコンポーネント** | `PascalCase` | `CycleCompare.astro`, `FeedbackFeatures.astro` |
| **Astroレイアウト** | `PascalCase` | `Layout.astro` |
| **Astroルーティングページ** | `kebab-case` または `小文字` | `index.astro`, `about.astro`, `rss.xml.js` |
| **TS/JSスクリプト・ユーティリティ** | `camelCase` | `dateFormatter.ts`, `authService.ts` |
| **CSSファイル** | `kebab-case` | `global.css` |
| **静的アセット（画像、フォントなど）**| `kebab-case` | `logo-white.png`, `hero-bg.jpg` |

### 2.2 変数・関数・定数の命名
- **変数名 / 関数名**: `camelCase` を使用する。
  - 意味の伝わる明確な名前にする（省略しすぎない。例: `element` ではなく `el` 等は最小限に）。
  - 例: `getUserProfile`, `totalPrice`
- **真偽値 (Boolean) の変数・関数**: `is`, `has`, `should`, `can` などの接頭辞をつける。
  - 肯定形（ポジティブワード）で命名する（例: `isNotLoaded` ではなく `isLoaded` を使用し否定は `!` で表現する）。
  - 例: `isLoading`, `hasError`, `shouldShowModal`
- **定数 (環境変数、グローバル設定、固定値など)**: `UPPER_SNAKE_CASE` を使用する。
  - 例: `API_BASE_URL`, `MAX_RETRIES`, `SITE_TITLE`
- **型定義・インターフェース**: `PascalCase` を使用する。
  - 例: `interface UserData`, `type AuthStatus`

---

## 3. コーディングルールとベストプラクティス

### 3.1 TypeScript
- **厳格な型指定 (`strict` モードの準拠)**:
  - `tsconfig.json` の設定に基づき、型チェックを厳しく行います。
  - `any` の使用は原則禁止です。どうしても型が不明な場合は `unknown` を用い、型ガード（Type Guards）で安全にダウンキャストします。
- **AstroコンポーネントのProps定義**:
  - コンポーネント外部から受け取る値は `interface Props` を使用して明確に型を定義します。
  - デフォルト値が必要な場合は、Astroフロントマターの分割代入時に定義します。
    ```astro
    ---
    interface Props {
      title: string;
      description?: string; // オプショナル
    }
    const { title, description = 'デフォルトの説明文' } = Astro.props;
    ---
    ```

### 3.2 Astroコンポーネントの構造ルール
Astroコンポーネントファイル内は、以下の順序で記述します。

1. **Astroフロントマター (`---`)**:
   - `import` 文（コンポーネント、ライブラリ、ユーティリティ、型など）。
   - `interface Props` の定義。
   - `Astro.props` の受け取り。
   - レンダリングに必要な前処理（UI描画に特化した簡易な定数定義など）。
2. **テンプレート（HTML/Astro要素）**:
   - セマンティックHTML（`section`, `article`, `nav`, `header`, `footer` 等）を適切に使用。
   - `h1` は1ページにつき原則1つとする。
   - `class:list` を用いて、動的なクラス制御をスマートに行う。
3. **クライアントスクリプト (`<script>`)**:
   - 必要最小限のスクリプトのみ記述。DOM操作や変化アニメーション定義など、複雑になる場合は `src/scripts/` などの外部ファイルに切り出してインポートする。
   - インラインのイベントハンドラ（例: `onclick="..."`）は避ける。

### 3.3 Tailwind CSS およびスタイリング
- **Tailwind CSS v4の活用**:
  - スタイリングは原則 Tailwind CSS のクラスをインラインで使用します。
  - **即値カラーの禁止**: カスタムカラー（例: `#4f46e5`）を `text-[#4f46e5]` のように即値で指定せず、`src/styles/global.css` の `@theme` に定義されたブランドカラー（例: `text-brand-primary`, `bg-wheat-light`, `text-brand-secondary` 等）を使用します。
- **共通デザインシステムの利用**:
  - `src/styles/global.css` に定義されているアニメーションやクラスを再利用します。
    - グラスモルフィズム: `.glass-panel`
    - スクロール時のアニメーション対象: `.scroll-reveal`（必要に応じて JS で `active` クラスを付与）
- **レスポンシブデザイン（モバイルファースト）**:
  - 接頭辞なしのクラスは「モバイル（画面幅が最も狭い状態）」を基準とし、`md:`, `lg:` 等を使用して大画面向けに上書きしていきます。
  - 例: `class="text-base md:text-lg lg:text-xl"`

---

## 4. レビューとデプロイ前の確認フロー

変更をコミットおよび Firebase Hosting 等へデプロイする前に、以下の確認手順を実行してください。

1. **型チェックと構文検証**:
   - `npm run astro check` （存在する場合）または `tsc` を実行し、AstroとTypeScriptの型エラーがないことを確認する。
2. **プロダクションビルドの検証**:
   - `npm run build` をローカルで実行し、ビルドエラーやリンク切れがないことを確認する。
3. **セルフレビュー**:
   - 本 `RULE.md` に定められた命名規則や、TDD的なロジック分離が行われているかを差分で確認する。
