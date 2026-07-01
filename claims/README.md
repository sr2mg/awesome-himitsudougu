# Claims

ここでは、ひみつ道具と現実の技術・製品・研究の対応を、1道具1Markdownで記録します。

JSONを直接編集する必要はありません。GitHub上でMarkdownを開き、編集してください。

Issue Formから提案すると、GitHub Actionsがこの形式のMarkdownを作り、Pull Requestを自動作成します。

## Issue Formから提案する

GitHubの画面だけで参加できます。直接開く場合は [技術対応の提案フォーム](https://github.com/sr2mg/awesome-himitsudougu/issues/new?template=technology-claim.yml) を使ってください。

1. リポジトリ上部の **Issues** タブを開く
2. **New issue** をクリックする
3. **技術対応の提案** を選ぶ
4. フォームを埋める
5. **Submit new issue** をクリックする

送信後、GitHub Actionsがこの形式のMarkdownを作り、Pull Requestを自動作成します。

## 直接Markdownを書く

自分でファイルを作る場合は、次の手順です。

1. `_template.md` をコピーする
2. ファイル名を道具IDにする
3. frontmatter を埋める
4. 「近い技術」「理由」「根拠」を書く

例:

```txt
claims/ishikoro-boshi.md
claims/honyaku-konnyaku.md
claims/takekoputa.md
```

## Status

| 表示 | 意味 |
| --- | --- |
| できた | 市販品・実用サービスで中核機能を満たす |
| だいたいできた | 形や制約は違うが、普通の利用者目線ではかなり近い |
| 一部できた | 中核機能の一部が製品化、または限定的に実現している |
| 研究中 | 学術研究・企業R&D段階 |
| まだ | 技術的な筋道はありそうだが、まだ実現していない |
| たぶん無理 | 現行物理では見込みが薄い |
| 評価しない | 現実技術との対応を問うのが不自然 |

迷った場合は `docs/realization-status.md` を参照してください。
