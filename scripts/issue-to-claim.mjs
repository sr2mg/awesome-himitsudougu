import { appendFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const issueNumber = process.env.ISSUE_NUMBER;
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!repo) throw new Error("GITHUB_REPOSITORY is required.");
if (!token) throw new Error("GITHUB_TOKEN is required.");
if (!issueNumber) throw new Error("ISSUE_NUMBER is required.");

const [owner, repoName] = repo.split("/");

async function githubFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function loadIssue() {
  if (eventPath) {
    try {
      const event = JSON.parse(await fs.readFile(eventPath, "utf8"));
      if (event.issue && String(event.issue.number) === String(issueNumber)) {
        return event.issue;
      }
    } catch {
      // Fall through to API.
    }
  }

  return githubFetch(`https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`);
}

function parseIssueForm(body) {
  const fields = {};
  const parts = (body || "").split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const [rawTitle, ...rest] = part.split(/\r?\n/);
    const title = rawTitle.trim();
    const value = rest.join("\n").trim();
    fields[title] = value === "_No response_" ? "" : value;
  }
  return fields;
}

function sanitizeId(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeYaml(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return JSON.stringify(text);
}

function bulletLines(text, fallback = "-") {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return fallback;
  return lines.map((line) => (line.startsWith("-") ? line : `- ${line}`)).join("\n");
}

function appendOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const delimiter = `EOF_${name}_${Date.now()}`;
  appendFileSync(outputPath, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}

const issue = await loadIssue();
const fields = parseIssueForm(issue.body || "");

const gadgetName = fields["対象の道具名"] || "";
const rawId = fields["道具ID"] || "";
const gadgetId = sanitizeId(rawId);
const status = fields["どのくらい実現していると思いますか？"] || "";
const confidence = fields["自信"] || "";
const technologyName = fields["近い技術・製品・研究"] || "";
const technologyUrl = fields["代表的な根拠URL"] || "";
const reason = fields["理由"] || "";
const evidenceUrls = fields["追加の根拠URL"] || "";
const notes = fields["メモ"] || "";

const claimPath = gadgetId
  ? `claims/${gadgetId}.md`
  : `claims/_inbox/issue-${issueNumber}.md`;

await fs.mkdir(path.dirname(claimPath), { recursive: true });

const evidenceBlock = bulletLines([technologyUrl, evidenceUrls].filter(Boolean).join("\n"));
const notesText = notes || `Created from #${issueNumber}.`;

const markdown = `---
id: ${escapeYaml(gadgetId)}
name: ${escapeYaml(gadgetName)}
status: ${escapeYaml(status)}
confidence: ${escapeYaml(confidence)}
review_status: draft
---

## 近い技術

${bulletLines(technologyName)}

## 理由

${reason.trim()}

## 根拠

${evidenceBlock}

## メモ

${notesText.trim()}
`;

await fs.writeFile(claimPath, markdown, "utf8");

const branch = `claim/issue-${issueNumber}`;
const prTitle = `Add claim: ${gadgetName || `issue #${issueNumber}`}`;
const prBody = [
  `Closes #${issueNumber}`,
  "",
  `Generated from issue #${issueNumber}.`,
  "",
  `Claim file: \`${claimPath}\``,
].join("\n");

appendOutput("issue_number", String(issueNumber));
appendOutput("branch", branch);
appendOutput("claim_path", claimPath);
appendOutput("pr_title", prTitle);
appendOutput("pr_body", prBody);
