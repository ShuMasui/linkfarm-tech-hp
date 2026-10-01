# CLAUDE.md

LinkFarm Tech. のホームページ（Astro）。このファイルは Claude Code 向けの前提メモ。

## main は保護ブランチ

**`main` には直接コミット・直接 push できない。** GitHub 側でブランチプロテクトがかかっており、
変更が本番に出るのは `main` への push をトリガーに `deploy-to-prod` が走るときだけ。
つまり **PR を通さない限りデプロイできない。**

したがって、どんなに小さな変更でも必ず：

1. 別ブランチを切る（`fix/` `chore/` `add/` などの接頭辞 + 内容）
2. そこにコミットする
3. PR を作って `test / check` の pass を確認する
4. マージ

「1行直すだけだから main で」は通らない。push が弾かれて作業をやり直すことになる。

手順の詳細（worktree の切り方、コミットの分け方、PR 本文、CI の見届け方、後片付け）は
`open-pr` スキル（`.claude/skills/open-pr/SKILL.md`）に書いてある。

## その他

- コーディング規約・設計方針: `RULE.md`
- 構成や各種ドキュメント: `docs/`
- タスク: `make help`（`make check` で lint → test → build）
- 記事の追加は `add-blog-post`、見た目の変更は `change-appearance` スキルを参照。
