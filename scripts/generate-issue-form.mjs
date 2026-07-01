import fs from "node:fs/promises";

const stubsPath = "data/gadget-stubs.json";
const issueFormPath = ".github/ISSUE_TEMPLATE/technology-claim.yml";

function readJsonWithBom(text) {
  return JSON.parse(text.replace(/^\uFEFF/, ""));
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function optionLabel(stub) {
  return `${stub.name} | ${stub.stub_id}`;
}

const dataset = readJsonWithBom(await fs.readFile(stubsPath, "utf8"));
const options = dataset.stubs
  .filter((stub) => stub.kind === "candidate")
  .map(optionLabel);

const uniqueOptions = [...new Set(options)];

if (uniqueOptions.length !== options.length) {
  throw new Error(`Duplicate issue form options: ${options.length - uniqueOptions.length}`);
}

const optionLines = uniqueOptions.map((option) => `        - ${yamlString(option)}`).join("\n");

const yaml = `name: 技術対応の提案
description: ひみつ道具と現実の技術・製品・研究の対応を提案する
title: "[claim] "
labels:
  - technology-claim
body:
  - type: markdown
    attributes:
      value: |
        対象の道具は既存候補から選んでください。候補にない道具は、いったん別Issueで一覧への追加を相談してください。
  - type: dropdown
    id: gadget
    attributes:
      label: 対象の道具（道具名 | 暫定ID）
      description: "道具名と、Wikipedia抽出時点の暫定IDです。"
      options:
${optionLines}
    validations:
      required: true
  - type: dropdown
    id: status
    attributes:
      label: どのくらい実現していると思いますか？
      options:
        - できた
        - だいたいできた
        - 一部できた
        - 研究中
        - まだ
        - たぶん無理
        - 評価しない
    validations:
      required: true
  - type: dropdown
    id: confidence
    attributes:
      label: 自信
      options:
        - 高
        - 中
        - 低
    validations:
      required: true
  - type: input
    id: technology_name
    attributes:
      label: 近い技術・製品・研究
      description: "例: Google Translate, POCKETALK, adaptive camouflage"
    validations:
      required: true
  - type: input
    id: technology_url
    attributes:
      label: 代表的な根拠URL
      description: 公式ページ、論文、企業発表、信頼できる記事など
    validations:
      required: false
  - type: textarea
    id: reason
    attributes:
      label: 理由
      description: 道具の中核機能と、現実技術が対応している点・足りない点を書いてください。
    validations:
      required: true
  - type: textarea
    id: evidence_urls
    attributes:
      label: 追加の根拠URL
      description: 複数ある場合は1行に1つずつ書いてください。
    validations:
      required: false
  - type: textarea
    id: notes
    attributes:
      label: メモ
      description: 迷っている点や補足があれば書いてください。
    validations:
      required: false
`;

await fs.writeFile(issueFormPath, yaml, "utf8");

console.log(`Generated ${issueFormPath}`);
console.log(`Options: ${uniqueOptions.length}`);
