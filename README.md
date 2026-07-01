# awesome-himitsudougu

ドラえもんの「ひみつ道具」が、現実の技術でどこまで実現されているかを追跡するための構造化データセットです。

単なる道具一覧ではなく、各項目を「事実」「道具性」「実現度」に分けて記録します。これにより、作中で本当に未来の道具として機能しているものだけを対象に、現実の製品・技術との対応を評価できます。

## 目的

このリポジトリは、次の問いに答えることを目指します。

- ひみつ道具として記録されているものは何か
- そのうち、作中で実際に機能する未来の道具はどれか
- その機能は、現実の製品・サービス・研究でどこまで実現されているか

## 収録方針

初期データは、日本語版 Wikipedia の「ドラえもんのひみつ道具」五十音記事をベースにします。

ただし、Wikipedia に載っている項目をそのまま「ひみつ道具」と確定するわけではありません。各項目について、別途 `gadgethood` を判定します。

- `gadget`: 作中で実際に機能する未来の道具
- `non_gadget`: 作中作の空想物、作者の想像物、単なる実在物など
- `uncertain`: 記述だけでは未来の道具か判別できないもの

著者性や掲載媒体は `provenance` として記録しますが、道具性の判定そのものには使いません。

## 評価パイプライン

LLM に一度にすべてを判断させず、3つのパスに分けて処理します。

### 1. 抽出

Wikipedia 記事から、名称、読み、別名、説明、初出、出典URLを抽出します。

この段階では、道具かどうか、現実で実現しているかは判断しません。説明文は原文をコピーせず、事実だけを自分の言葉で要約します。

### 2. 道具性判定

抽出済みレコードに `gadgethood` と `evaluable` を付与します。

`evaluable` は、現実の技術や製品との対応を問えるかどうかを表します。魔法、寓話的効果、感情操作、一発ギャグのようなものは、未来の道具として登場していても実現度評価の対象外にします。

### 3. 実現度評価

`gadgethood.status == "gadget"` かつ `evaluable == true` のものだけを対象に、現実技術での実現度を評価します。

実現度は次のいずれかで記録します。ユーザー向けの表示では、日本語ラベルを使います。

| 表示 | 内部値 | 意味 |
| --- | --- | --- |
| できた | `realized` | 市販品・実用サービスで中核機能を満たす |
| だいたいできた | `mostly_realized` | 形や制約は違うが、普通の利用者目線ではかなり近い |
| 一部できた | `partial` | 中核機能の一部が製品化、または限定的に実現している |
| 研究中 | `research` | 学術研究・企業R&D段階 |
| まだ | `not_yet` | 技術的な筋道はありそうだが、まだ実現していない |
| たぶん無理 | `physically_hard` | 現行物理では見込みが薄い |

評価対象外の項目は、`realization` を `null` にします。

## 判定例

| 項目 | 道具性 | 実現度評価 | 理由 |
| --- | --- | --- | --- |
| 石ころぼうし | `gadget` | 対象 | 作中で機能する未来の道具で、認識回避という機能を現実技術と比較できる |
| アイディア考え機 | `non_gadget` | 対象外 | 作中世界のさらに内側にある空想上の道具として扱われる |
| 赤まむしドリンク | `uncertain` | 対象外 | 未来の道具なのか、普通の実在物なのか判別できない |
| 相合い傘 | `gadget` | 対象外 | 作中の道具ではあるが、感情操作は現実技術評価に向かない |

## データ構造

各レコードは、おおむね次の構造を持ちます。

```json
{
  "id": "ishikoro-boshi",
  "name": "石ころぼうし",
  "yomi": "いしころぼうし",
  "aliases": [],
  "description": "かぶった人が周囲から石ころのように気にされなくなる帽子。",
  "provenance": {
    "author_canon": "fujiko_f",
    "first_appearance": {
      "work": "unknown",
      "medium": "unknown",
      "volume": "unknown"
    }
  },
  "gadgethood": {
    "status": "gadget",
    "reason": "作中で実際に機能する未来の道具として登場する。"
  },
  "evaluable": true,
  "realization": {
    "status": "partial",
    "real_world": [],
    "confidence": "medium"
  },
  "sources": [
    "https://ja.wikipedia.org/"
  ],
  "extraction_notes": "",
  "review_flags": []
}
```

正式なスキーマは `schemas/` で管理します。

- `schemas/wikipedia-pages.schema.json`: 初期抽出に使うWikipediaページ台帳
- `schemas/gadget-stub.schema.json`: Wikipedia から機械的に展開した未判断候補
- `schemas/extract-record.schema.json`: パス1の事実抽出レコード
- `schemas/judged-record.schema.json`: パス2の道具性判定済みレコード
- `schemas/himitsudougu-record.schema.json`: 正規化済みの最終レコード

データモデルの詳細は `docs/data-model.md` を参照してください。
実現度ラベルの詳細は `docs/realization-status.md` を参照してください。

## ライセンスと出典

Wikipedia などの外部情報源は、検証用の出典として `sources` に記録します。

説明文は外部サイトの文章をコピーせず、事実だけを独自の文章で要約します。これは、再配布時のライセンス混入を避けるためです。

## 今後の予定

- スキーマの整備
- 3パス用プロンプトの追加
- promptfoo による境界事例の評価
- Wikipedia 五十音記事からの初期スタブ生成
- 実現度ステータスの人手レビュー

## 生成

Wikipedia ページ台帳から未判断候補を再生成するには、次を実行します。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\generate-gadget-stubs.ps1
```

## 参加するには

いちばん簡単な参加方法は、[技術対応の提案フォーム](https://github.com/sr2mg/awesome-himitsudougu/issues/new?template=technology-claim.yml) から「この道具はこの技術に近いと思う」と提案することです。

1. GitHubリポジトリ上部の **Issues** タブを開く
2. **New issue** をクリックする
3. **技術対応の提案** を選ぶ
4. フォームに、道具名、近い技術、実現度、理由、根拠URLを書く
5. **Submit new issue** をクリックする

Issueを作ると、GitHub Actionsが `claims/` のMarkdownファイルを作り、Pull Requestを自動作成します。

```txt
Issue Form
  -> claims/<道具ID>.md
  -> Pull Request
```

道具IDが分からない場合は空欄で大丈夫です。その場合は `claims/_inbox/issue-<番号>.md` に入り、あとでPR上で整理できます。

### 直接編集する場合

現実技術との対応は、`claims/` に1道具1Markdownで記録します。

```txt
claims/
  _template.md
  ishikoro-boshi.md
```

JSONを直接編集する必要はありません。GitHub上でMarkdownを開いて、近い技術、理由、根拠URLを追記します。

詳細は `claims/README.md` を参照してください。
