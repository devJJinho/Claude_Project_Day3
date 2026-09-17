# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 현황

애플리케이션 본체(결혼 준비 사이트 자체)는 아직 구현 전이다. 지금 저장소에 있는 코드는 backlog 관리용 도구(CLI, hooks, 대시보드)뿐이다 — Day_1_문제정의 프로젝트에서 만든 것을 그대로 재사용했다.

- **기술 스택**: 미확정. 개발요청서.md E2에서 "특정 프레임워크/클라우드 지정 없음 — 개발자(본인) 재량"으로 확정됨. 실제 구현 착수 시 스택을 정하고 이 문서와 `.claude/tools/quality-config.mjs`의 `SOURCE_DIRS`를 갱신할 것.
- 코드 품질 명령: `npm run verify` (길이/lint/build — 세부 규칙은 `.claude/rules/code-structure.md`).
- backlog 조회/변경: `node .claude/tools/backlog-cli.mjs help` — 세부 사용법은 `.claude/skills/backlog/SKILL.md`, 변경 주체·상태 규칙은 `.claude/rules/`.
- 대시보드: `dashboard/index.html` (읽기 전용 뷰어, 파일 선택으로 backlog.json 확인).

작업을 시작하기 전 반드시 `개발요청서.md` 전체를 읽을 것. 이 문서는 사용자와의 대화를 통해 확정된 개발요청서이며, "확인된 사실"과 "결정 완료" 섹션이 최종 요구사항이다(미결 질문은 모두 해소됨).

## 작업 실행 순서

이 순서를 따른다 (세부 규칙은 각 항목이 가리키는 파일 참고):

1. **기준 확인**: `개발요청서.md` 읽기 + `node .claude/tools/backlog-cli.mjs list/show/ready`로 현재 backlog 조회 + `.claude/rules/*.md`로 현재 적용 규칙 확인. backlog.json을 Read/Grep/Bash로 직접 열지 않는다(`.claude/rules/backlog-ownership.md`).
2. **작업 선택**: `ready` 명령으로 deps가 모두 끝난 후보만 본다. done_when이 불명확하면 note를 근거로 유추하되, 불명확함 자체를 인지한다.
3. **착수 기록**: 실제로 시작했을 때 `set-status <id> doing`. 현재 스키마엔 owner/claimed_at 필드가 없다 — 없는 정보를 지어내 채우지 않는다(`.claude/rules/status-transition.md`).
4. **구현**: `.claude/rules/code-structure.md`의 책임 분리·길이 기준을 지키며 작성하고 `npm run verify`로 hooks가 검사하는 항목(길이/lint/build)을 통과시킨다.
5. **버전 고정 후 병렬 검토**: `list --json`의 `sourceHash`로 입력 버전을 고정하고, 같은 스냅샷을 `critical-reviewer`와 `backlog-explainer`(둘 다 `.claude/agents/`)에게 전달해 병렬 실행한다.
6. **반영**: 두 결과를 합쳐, 근거(추측 아닌 확인된 사실)가 있는 지적만 CLI로 반영하고 `npm run verify`를 재실행한다.
7. **완료 기록**: done_when·검사 결과·검토 반영이 모두 확인됐을 때만 `set-status <id> done --evidence "..."`. 리뷰 미실행/검사 실패 상태는 완료 근거가 될 수 없다(`.claude/rules/status-transition.md`).
8. **문서·대시보드 확인**: backlog.json이 바뀌면 관련 `docs/backlog/<id>.md`가 최신 스냅샷을 반영하는지 확인하고(필요하면 `backlog-explainer` 재실행), 대시보드에서 재조회해 확인한다(`.claude/rules/doc-sync.md`).
9. **항상 이어서 시작할 수 있게 기록**: 상태가 바뀔 때마다 그 즉시 `set-status`/`set-deps`로 backlog.json에 반영한다.

사람의 결정이 필요한 지점을 만나면 임의로 정하지 말고 `set-status <id> needs_info --note "<질문>"`으로 남긴다.

## 프로젝트 개요

**결혼 준비 사이트** — 결혼 준비 중인 예비 신랑·신부가 결혼식장·스튜디오·메이크업·드레스 등 여러 항목의 후보를 한 곳에 모아 공유하고, 지도에서 위치를 겹쳐보며 빠르게 의사결정할 수 있는 서비스.

- 핵심 시나리오: 항목(워크플레이스) 생성 → 참여자 각자 후보 등록(링크/위치/코멘트/가격 등) → 대시보드에서 확인 → 지도에서 여러 항목 위치 겹쳐보기 → 후보 확정
- 사용자: 20대 후반~30대 초반 예비 신랑·신부 + 허용된 추가 참여자(웨딩플래너/가족/친구), 전원 동일 권한
- 비목표: 유료 결제 기능

전체 요구사항은 `개발요청서.md`(A~H 섹션)를 단일 진실 공급원으로 삼는다 — 아래는 코드 작성 시 바로 참고할 핵심 제약만 요약한 것이며, 상세·근거는 항상 원문을 확인할 것.

## 핵심 요구사항 요약 (설계 시 반드시 지킬 제약 — 상세는 개발요청서.md)

1. **인증/협업(A)**: 소셜 로그인, 각자 개별 계정 + 커플 연결, 초대는 소셜 계정 지정 + 승인 필요, 참여자 전원 동일 권한, 탈퇴해도 등록한 데이터는 남음.
2. **데이터 모델(B)**: 항목(카테고리)은 추천 목록 + 직접 추가 동시 지원. 후보 필드(링크/위치/코멘트/가격/사진/예약/평점)는 전부 선택 입력. 상태값은 후보/보류/탈락/확정 4종, 항목당 확정 개수 제한 없음.
3. **지도(C)**: 네이버지도 API. 겹쳐보기는 마커 표시만 — 거리/시간 계산 기능은 만들지 않는다.
4. **공유(D)**: 실시간 반영 필요. 푸시 알림 없음 — 새 등록은 앱 내 표시(배지 등)로만 안내.
5. **플랫폼(E)**: 반응형 웹(네이티브 앱/PWA 아님). 기술 스택은 개발자 재량. 무료/최소 비용 인프라.
6. **보안/운영(F)**: 기본 비공개(초대·승인된 참여자만 접근). 데이터는 사용자가 직접 삭제하기 전까지 계속 보관.
7. **MVP 범위(G)**: 대시보드, 항목 추가, 지도 겹쳐보기, 초대, 체크리스트, D-day 카운트다운, 예산 관리 — 전부 1차에 포함. 마감일 없음.
8. **UX(H)**: 한국어만. 디자인 레퍼런스 없음 — 개발자 재량.

## 개발자 재량 / 임의로 정하지 말아야 할 것

- 기술 스택 자체는 재량이지만, 선택한 뒤에는 `.claude/tools/quality-config.mjs`의 `SOURCE_DIRS`에 실제 소스 디렉터리를, `.claude/tools/backlog-schema.mjs`의 `KNOWN_CATEGORIES`에 실제 기능 카테고리를 반영해 최신 상태로 유지할 것.
- 개발요청서.md에 없는 세부사항(정확한 UI 문구, 알림 문구, 상태값 표시 라벨 등)은 지어내지 말고 `needs_info`로 남기거나 사용자에게 확인한다.

## 일하는 방식 세부 규칙

`.claude/rules/`에 아래 파일들이 있고, Claude Code가 세션 시작 시 이 CLAUDE.md와 같은 우선순위로 자동 로드한다:

- `backlog-ownership.md` — backlog.json을 누가/무엇으로 바꾸는지, subagent 병렬 실행 중 동시성 규칙
- `status-transition.md` — 허용 상태(`todo`/`doing`/`done`/`blocked`/`needs_info`)와 전이 조건, 완료 근거로 인정하지 않는 것
- `code-structure.md` — 코드 책임 분리, 파일 길이, lint/build
- `doc-sync.md` — PROGRESS.md/docs/backlog 문서가 언제·어떤 조건으로 갱신되는지

각 규칙 항목은 `[hook]`(기술적으로 검사/차단됨) / `[지침]`(Claude가 읽고 스스로 따름, 강제 없음) / `[리뷰]`(subagent가 확인)로 표시돼 있다.
