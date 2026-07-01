# Data Model

このリポジトリでは、Wikipedia の一覧ページから得た項目をすぐに「ひみつ道具」と確定しません。

データは次の3層に分けます。

## 1. Source Page

Wikipedia など、抽出元ページの台帳です。

現在は `sources/wikipedia_pages.json` に、個別記事と五十音一覧ページを分けて記録します。

この層は「どこから取るか」だけを表し、道具名や実現度は持ちません。

## 2. Gadget Stub

一覧ページや個別記事から機械的に取り出した候補です。

保存先の想定:

```txt
data/gadget-stubs.json
```

この段階では、候補が本当に未来の道具か、現実技術で評価可能かは判断しません。

主な用途:

- Wikipedia 見出しを取りこぼさず保存する
- 後続の LLM 抽出パスに渡す単位を作る
- 重複、リダイレクト、別名候補を人間が確認できるようにする

## 3. Himitsudougu Record

正規化済みの1道具レコードです。

保存先の想定:

```txt
data/records.json
```

この層では、事実情報、道具性、実現度を同じレコードに持ちます。ただし、それぞれを別パスで埋めます。

## Processing Flow

```txt
sources/wikipedia_pages.json
  -> data/gadget-stubs.json
  -> data/extracted-records.json
  -> data/judged-records.json
  -> data/records.json
```

## ID Policy

`id` は正規レコードだけが持つ安定IDです。

- ひらがな読みを正規化する
- 長音、記号、空白を除く
- ローマ字化する
- 同一機能の別名は別IDにせず、`aliases` に集約する

Wikipedia から展開しただけの `gadget-stub` には、恒久IDではなく `stub_id` を付けます。

## Unknown Policy

不明な情報を推測で埋めません。

- 事実が不明な場合は `"unknown"`
- 判断不能な場合は `"uncertain"`
- 対象外または未評価の `realization` は `null`

この区別を保つことで、あとから人手レビューや再評価をしやすくします。

## Schema Files

- `schemas/wikipedia-pages.schema.json`: 抽出元ページ台帳
- `schemas/gadget-stub.schema.json`: 機械展開された未判断候補
- `schemas/gadget-stubs.schema.json`: 未判断候補データセット
- `schemas/extract-record.schema.json`: パス1の事実抽出レコード
- `schemas/extract-records.schema.json`: パス1データセット
- `schemas/judged-record.schema.json`: パス2の道具性判定済みレコード
- `schemas/judged-records.schema.json`: パス2データセット
- `schemas/himitsudougu-record.schema.json`: パス3後の最終レコード
- `schemas/himitsudougu-records.schema.json`: 最終データセット
