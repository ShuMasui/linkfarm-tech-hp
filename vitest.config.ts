import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ロジックは src/utils/ 以下のピュアな TypeScript に切り出す方針のため、
    // テスト対象もそこに置く（RULE.md 1.1 ビューとロジックの分離）
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'node',
  },
});
