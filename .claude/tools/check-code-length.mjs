#!/usr/bin/env node
// 소스 파일 줄 수 검사. backlog.json(데이터), PROGRESS.md/.bak(생성물), node_modules/.next
// (의존성·빌드 산출물)는 SOURCE_DIRS/SOURCE_EXTENSIONS 설정과 EXCLUDED_DIR_NAMES로 제외한다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { LINE_LIMIT, SOURCE_DIRS, SOURCE_EXTENSIONS } from "./quality-config.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// src/ 아래에 재귀적으로 나타날 수 있는 생성물/의존성 디렉터리는 이름으로 걸러낸다.
const EXCLUDED_DIR_NAMES = new Set(["node_modules", ".next", ".git", "dist", "build", "coverage"]);

function walk(dirAbs, files) {
  let entries;
  try {
    entries = readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || EXCLUDED_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
}

export function listSourceFiles() {
  const files = [];
  for (const dir of SOURCE_DIRS) {
    walk(path.join(PROJECT_ROOT, dir), files);
  }
  return files;
}

export function countLines(filePath) {
  const content = readFileSync(filePath, "utf8");
  if (content === "") return 0;
  return content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
}

/**
 * @param {string[]} files 검사할 절대경로 목록
 * @returns {{file:string, lines:number}[]} LINE_LIMIT을 초과한 파일만
 */
export function checkCodeLength(files) {
  const violations = [];
  for (const f of files) {
    const lines = countLines(f);
    if (lines > LINE_LIMIT) violations.push({ file: f, lines });
  }
  return violations;
}

function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  const targets = process.argv.slice(2).length > 0 ? process.argv.slice(2).map((p) => path.resolve(p)) : listSourceFiles();
  const violations = checkCodeLength(targets);
  if (violations.length === 0) {
    console.log(`코드 길이 검사 통과 (기준 ${LINE_LIMIT}줄, 대상 ${targets.length}개 파일)`);
    process.exit(0);
  }
  console.error(`코드 길이 기준(${LINE_LIMIT}줄) 초과 ${violations.length}건:`);
  for (const v of violations) {
    console.error(`  - ${path.relative(PROJECT_ROOT, v.file)}: ${v.lines}줄 (초과 ${v.lines - LINE_LIMIT}줄)`);
  }
  console.error(`\n압축이나 의미 없는 분할 대신, 책임 단위(예: 읽기/쓰기/진입점)로 나누는 걸 검토하세요.`);
  process.exit(1);
}
