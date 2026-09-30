---
name: open-pr
description: 変更を main に入れるための一連の手順。worktree でのブランチ作成、コミットの分け方、テンプレートに沿った PR 作成、CI の pass 確認、マージ後の片付けまで。「PR を作って」「ブランチを切って」「main に入れたい」と言われたら使う。
---

# PR を作る

**main には直接コミットしない。** 変更は必ず PR を通す。

## 1. worktree でブランチを切る

```
git fetch origin
git worktree add -b <branch> <スクラッチパス>/wt-<名前> origin/main
```

**worktree を使う理由: 手元の作業ツリーを汚さないため。**
書きかけの変更が別にあっても、それを stash せずに並行できる。

ブランチ名は `fix/` `chore/` `add/` などの接頭辞 + 内容。

未コミットの変更が手元にあるときは、**それを PR に巻き込んでよいか必ず確認する。**
無関係な変更が混ざった PR はレビューできない。

## 2. 通す

```
make check
```

worktree は `node_modules` を持たないので、先に `npm ci` が要る。
**メインの `node_modules` をシンボリックリンクしないこと。** パス解決が壊れてビルドが落ちる。

## 3. コミットを分ける

**意味の単位で分ける。** 「CI を直した」「テンプレを足した」「不要物を消した」は別コミット。

メッセージは**「何を」ではなく「なぜ」**を書く。
差分を見れば何をしたかは分かる。分からないのは、なぜそうしたか。

```
ci: PR でも検査ジョブを走らせる

これまで CI は main への push でしか起動せず、PR の時点では
型エラーやテストの失敗に気づけなかった。pull_request を
トリガーに追加し、check ジョブを PR で走らせる。
```

## 4. PR を作る

```
gh pr create --base main --head <branch> --title "..." --body "..."
```

**本文は `.github/pull_request_template.md` の構成に沿わせる。**
種別 / 概要 / 内容 / 確認したこと。

- 確認項目は**実際に確認したものだけ**チェックを入れる
- 見た目を変えたならスクショを貼る（`change-appearance` スキル参照）
- 検証できなかったことがあれば「未検証」として明記する。黙って省かない

## 5. CI を見届ける

```
gh pr checks <番号>
```

必須チェックは **`test / check`**（`check-pr` ワークフローが `test.yml` を呼ぶ形なのでこの名前）。

**pass を自分の目で確認するまで「完了」と報告しない。**
PR を作った時点はまだ完了ではない。

`build` / `deploy` は PR では走らない（`deploy-to-prod` が main への push で起動する）。

## 6. マージ後に片付ける

```
git worktree remove <パス>
git checkout main && git fetch origin && git merge --ff-only origin/main
git branch -d <branch>
```

worktree を消す前に、**未コミットの変更が残っていないか確認する。**
