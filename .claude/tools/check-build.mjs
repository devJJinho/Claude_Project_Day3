#!/usr/bin/env node
// .claude/hooks, .claude/tools, dashboard의 Node ESM 스크립트(.mjs/.js)에는 번들러/트랜스파일러가
// 없어 별도의 "빌드 산출물 생성" 단계가 없다 — 소스를 그대로 node로 실행하기 때문이다. 그래서
// `node --check`(문법+모듈 해석 검사, 실행은 하지 않음)로 대체 검증한다.
// src/(Next.js 앱, .ts/.tsx)는 대상이 아니다 — `node --check`는 JSX/TS 구문을 이해하지 못해
// ERR_UNKNOWN_FILE_EXTENSION으로 실패한다. 그 대신 실제 `next build`(npm run build, verify의
// 마지막 단계)가 TypeScript 타입 검사까지 포함해 검증한다 — 이 스크립트와 역할이 겹치지 않는다.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { listSourceFiles } from "./check-code-length.mjs";
import { INNER_CHECK_TIMEOUT_MS } from "./quality-config.mjs";

const NODE_CHECKABLE_EXTENSIONS = [".mjs", ".js"];

export function runBuildCheck() {
  const files = listSourceFiles().filter((f) => NODE_CHECKABLE_EXTENSIONS.some((ext) => f.endsWith(ext)));
  const failures = [];
  const timeouts = [];

  for (const f of files) {
    const r = spawnSync(process.execPath, ["--check", f], {
      timeout: INNER_CHECK_TIMEOUT_MS,
      encoding: "utf8",
    });
    if (r.error && r.error.code === "ETIMEDOUT") {
      timeouts.push(f);
      continue;
    }
    if (r.status !== 0) {
      failures.push({ file: f, stderr: (r.stderr || "").trim() });
    }
  }

  return { files, failures, timeouts };
}

function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  console.log(".claude 도구 스크립트(.mjs/.js) 문법 검사: `node --check` (앱 코드는 `next build`가 별도로 검증).");
  const { files, failures, timeouts } = runBuildCheck();
  if (failures.length === 0 && timeouts.length === 0) {
    console.log(`build(문법 검사) 통과: ${files.length}개 파일`);
    process.exit(0);
  }
  for (const f of failures) {
    console.error(`FAIL: ${f.file}\n${f.stderr}`);
  }
  for (const f of timeouts) {
    console.error(`TIMEOUT(미검증): ${f} — ${INNER_CHECK_TIMEOUT_MS}ms 내 완료되지 않아 통과로 취급하지 않음`);
  }
  process.exit(1);
}
