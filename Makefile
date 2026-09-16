# LinkFarm Tech. — 開発タスク
#
#   make lint   型検査（astro check）
#   make test   単体テスト（vitest）
#   make build  本番ビルド（astro build）
#
# 詳細は docs/04-web.md を参照。

.DEFAULT_GOAL := help
.PHONY: help install dev lint test test-watch build preview check clean fonts

NPX := npx --no-install

## help: タスク一覧を表示する
help:
	@echo "LinkFarm Tech. — 開発タスク"
	@echo ""
	@grep -E '^## [a-z-]+:' $(MAKEFILE_LIST) \
		| sed -e 's/^## //' \
		| awk -F': ' '{ printf "  \033[1m%-12s\033[0m %s\n", $$1, $$2 }'
	@echo ""

## install: 依存をロックファイル通りに入れる
install:
	npm ci

## dev: 開発サーバーを起動する
dev:
	$(NPX) astro dev

## lint: 型とテンプレートを検査する
lint:
	$(NPX) astro check

## test: 単体テストを実行する
test:
	$(NPX) vitest run

## test-watch: テストを監視モードで実行する
test-watch:
	$(NPX) vitest

## build: 本番ビルドを dist/ に出力する
build:
	$(NPX) astro build

## preview: ビルド済みの dist/ をローカルで確認する
preview:
	$(NPX) astro preview

## check: lint と test と build を順に通す（CI と同じ内容）
check: lint test build

## fonts: Google Fonts から woff2 を取り込み直す（public/fonts/）
fonts:
	node scripts/fetch-fonts.mjs

## clean: ビルド成果物とキャッシュを削除する
clean:
	rm -rf dist .astro
