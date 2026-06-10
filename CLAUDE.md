# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 운영 헌법 — 자율 개발 스택 R4.1

**mode: team** · 상위 레퍼런스 = `AUTONOMOUS-STACK-REFERENCE.md`(충돌 시 그 문서 우선) · 불변 원칙 = `specs/constitution.md`
(1인 운용으로 축소할 때만 `mode: solo` — 게이트 차이: G1/G2가 타 팀원 PR Approve 대신 터미널 승인 + required approvals 0)

## 스택 / 확정 명령

Next.js(App Router) + TypeScript + vitest + Playwright + npm + Node 22

| 용도 | 명령 |
|---|---|
| TEST_CMD | `npx vitest run --reporter=dot -t '^(?!.*@quarantine)'` |
| RELATED_TEST_CMD | `npx vitest related --run <files>` |
| LINT_CMD | `npx eslint .` |
| FORMAT_CMD | `npx prettier --write <file>` |
| TYPECHECK_CMD | `npx tsc --noEmit` |
| E2E_CMD | `npx playwright test --retries=1 --grep-invert @quarantine` |
| MUTATION_CMD | `npx stryker run --incremental` |
| SPEC_LINT | `bash .claude/hooks/spec-lint.sh <specs/NNN-slug \| --all>` |
| CHANGELOG | `bash .claude/hooks/changelog.sh --pending "<제목>"` — main에 쌓일 커밋마다 |

보안 3중(스택 무관 고정): gitleaks · semgrep(`p/ci` + `.semgrep/`) · npm audit

## 오케스트레이터 수칙

1. **직접 구현 금지 — 위임만.** 스펙=spec-writer, 설계=architect, 테스트=test-designer, 구현=implementer, 검증=spec-verifier·e2e-tester, 감사=code-reviewer.
2. **1볼트 = 1세션.** 볼트 시작 전 `/clear` — 이전 볼트의 맥락 오염 금지. 맥락 복원은 SessionStart 훅 + design.md 스냅샷이 한다.
3. 의도의 입구는 둘뿐: **터미널 대화**, **`specs/_inbox/`**. (GitHub Issues 금지 — constitution §12)
4. 에스컬레이션 화이트리스트(아래) 외에는 **스스로 결정하고 기록한다** — 볼트 내부 결정은 design.md Decision Log, 볼트를 넘는 결정은 `docs/adr/`.
5. 스펙과 코드가 모순되면 코드를 우회하지 않는다 — `/spec --revise`뿐.
6. **연속 CHANGELOG**: main에 쌓이는 모든 커밋(= PR squash + 직접 커밋 예외)은 같은 커밋에 `changelog.sh`로 재생성한 `CHANGELOG.html`을 동반한다 — /ship ①이 표준 경로. HTML은 git log의 파생물: 손편집 금지, 충돌은 재생성으로 해소 (constitution §13).

## 볼트 페이즈 상태머신 (§2)

| phase | 의미 | 강제 장치 |
|---|---|---|
| IDLE→SPEC | /spec 진행 | spec-lint, 질문 일괄 1회, NNN 원자 할당 |
| GATE1 | Draft PR에 타 팀원 Approve → /bolt가 스탬프 | 승인 없으면 /bolt 진입 불가 |
| PLAN | design/tasks(touches) + ADR → **PLAN push = 점유 게시** | WIP·충돌 검사 + push 후 재검사, locks 캐시 |
| RED | 인수(S#)+단위(R#) 실패 확인 | 테스트 먼저 — implementer 미투입 |
| GREEN | 최소 구현 | guard가 테스트·acceptance 수정 물리 차단 |
| REFACTOR | 정리 + origin/main 병합 | 충돌 해석은 spec 기준 |
| VERIFY | 블라인드 예측→실측 + e2e·비주얼·axe | verification.md 매트릭스 |
| REVIEW | code-reviewer 감사 | 테스트 약화·검역 남용 적발 |
| GATE2 | /ship → Ready → checks green → Approve → merge queue | required checks + approvals 1 |
| SHIPPED | squash 머지 = main = 배포 | 릴리스는 플래그 토글 |

PLAN push가 볼트의 마지막 ask — RED부터 /ship 전까지 **무중단 자율 구간**(push·질문 0회).

## 인간 게이트

- **G1 (명세 승인)** = 스펙만 담긴 Draft PR에 **다른 팀원의 Approve**. /bolt가 `gh pr view --json reviews`로 확인 후 spec frontmatter에 `approved_by/approved_at/approved_sha` 스탬프 커밋(리뷰 상태는 새 커밋으로 휘발 — 영속 기록은 frontmatter).
- **G2 (출하 승인)** = 같은 PR Ready + required checks green + 최종 Approve → `gh pr merge --auto --squash`(ask). **G2 승인 후 커밋 push 금지**(dismiss stale이 승인 휘발).
- 리뷰어도 Claude Code 사용: `/review <PR#>`가 브리프 생성, **판단·제출만 사람**.

## 에스컬레이션 화이트리스트 (이외 질문 금지)

① 요구사항 모순 ② 비가역 작업(운영 DB·결제·배포 인프라) ③ 시크릿/자격증명 부재 ④ done-check 5연속 실패 ⑤ 볼트 예산 초과(tool_calls 400 또는 120분 — `.claude/state/budget.json`) ⑥ 조정 교착(touches 충돌 30분 미해소, spec으로 해석 불가한 병합 충돌)

## [ASSUMED] 규약

모호함을 만나면 묻지 말고: 합리적 기본값 채택 → 해당 문서(spec이면 spec, 전역이면 이 파일 하단)에 `[ASSUMED]` 태그로 기록 → 계속 진행. 사람이 나중에 일괄 검토·뒤집는다.

## AMEND 절차 (보호 경로 수정)

`.claude/**` · `specs/constitution.md` · `docs/adr/**` 는 guard가 차단한다. 수정 절차:
1. 사람이 터미널에서 **"AMEND 승인"** 명시 → `echo -n "AMEND" > .claude/state/phase`
2. 변경 → PR(훅 변경 포함 시 본문에 **"전원 /hooks 재승인 필요"** 명시) → CODEOWNERS 리뷰 → 머지
3. `echo -n "IDLE" > .claude/state/phase` 복귀

## 팀 수칙

- 작업 시작 시 `git fetch origin`으로 main 최신화. 팀 보드는 `/status`(= `gh pr list` 표면).
- 리뷰 요청을 받으면 **24시간 내 `/review`** (SLA).
- 훅 스크립트가 변경된 PR을 pull 하면 **각자 자기 세션에서 `/hooks` 재승인**(보안 설계).
- WIP 한도: 1인 1볼트, 팀 열린 구현 PR ≤ 인원수+2 — /bolt가 검사.
- 개인 설정은 `.claude/settings.local.json`(견본: `.claude/settings.local.json.example`) — allow 추가만, deny 완화·훅 약화는 constitution 위반.
- /handoff NNN @인수자 = 스냅샷 강제 기록 + owner 갱신 + push + 로컬 상태 정리. 인수자는 `/bolt NNN`.

## 커맨드 요약

`/spec <설명|_inbox/파일|--revise NNN>` → `/bolt NNN` → `/ship NNN` | 리뷰어: `/review <PR#>` | 보조: `/verify NNN` · `/status` · `/handoff NNN @핸들` · `/retro`(분기)

---

## [ASSUMED] — 부트스트랩 가정 목록 (사람 검토 대상)

1. **스택**: 완전히 빈 리포 → Next.js(App Router)+TS+vitest+Playwright 채택 (R4 §1-[0] 기본값). 리포명이 trade-research이므로 Python 데이터 스택이 필요해지면 `/spec --revise`급 결정으로 재논의.
2. **Node 22**: 로컬 v22.16 감지 — 참조 문서 예시(20) 대신 22로 통일(CI·devcontainer 동일).
3. **guard 훅 배선 확장**: [2]의 jsonc는 PreToolUse를 Bash에만 걸지만, [4]의 "테스트/스펙/보호 경로 수정 차단"은 Edit/Write 경로가 본체이므로 `Edit|Write|MultiEdit`에도 guard.sh를 배선.
4. **보호 경로 예외**: `.claude/state/**`(런타임 상태)와 `.claude/settings.local.json`(개인 설정)은 AMEND 없이 쓰기 허용 — 아니면 페이즈 전환 자체가 불가능.
5. **jq 로컬 부재**: 훅 전부에 python3 폴백 내장. devcontainer/CI에는 영향 없음.
6. **semgrep**: 로컬 pip --user 설치(1.165.0) 완료 — 강등 불필요. gitleaks 8.30.1을 `~/.local/bin`에 설치.
7. **/ops-review 미생성**: Sentry/PostHog 등 관측성 연동 부재. 연동 도입 시 AMEND로 추가.
8. **CODEOWNERS**: 확인 가능한 팀원이 @dkdlqoddi 뿐 — 팀원 합류 시 추가 필요.
9. **배포**: Vercel류 Git 연동(main 머지 = 자동 배포) 가정 — 자체 deploy 잡 미생성. 다른 파이프라인이면 gates.yml에 deploy 잡 추가.
10. **검역 태그 구현**: vitest는 `-t '^(?!.*@quarantine)'`(이름 정규식), playwright는 `--grep-invert @quarantine`.
11. **E2E webServer**: `npm run dev` 기준(빈 스캐폴딩) — 프로덕션 동작 검증이 필요해지면 build+start로 교체.
12. **prisma 부재**: ask 목록에서 `npx prisma migrate deploy` 제거(도입 시 AMEND로 복원).
