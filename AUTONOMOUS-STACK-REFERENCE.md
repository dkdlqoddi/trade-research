# 자율 개발 스택 — 구축 참조 문서

**버전** R4 (팀 협업 프로파일 · 전원 Claude Code) · 2026-06 — **R4.1 (2026-06-10)**: 연속 CHANGELOG 조항 추가([4] changelog.sh, [5] /ship ①, [6] 연속 CHANGELOG)
**스택** AI-DLC × SDD × TDD × BDD + 확장 게이트 + 협업 조정 레이어
**모델** 오케스트레이터 = `claude-fable-5` · 모든 서브에이전트 = `claude-opus-4-8`
**대상** Next.js · Python · API · DB · 이커머스 / 팀 규모 2~8인, 전원이 각자 Claude Code 사용

> **이 문서의 용도** — 이 파일은 Claude Code에 전달되는 **구축 지시서이자 단일 진실**이다.
> Claude Code는 §1의 실행 프로토콜과 설치 지시를 그대로 수행해 프로젝트 골격 전체를 생성하고,
> 이후 운영 중에도 이 문서를 최상위 레퍼런스로 삼는다.
> R3(1인 프로파일)의 "게이트 = 터미널" 규정과, HTML 가이드 §12의 이슈 기반 모델은
> **본 R4가 대체**한다. 충돌 시 이 문서가 우선한다.

---

## §0. 불변 운영 원칙

### 0.1 방법론 스택

| 층 | 답하는 질문 | 핵심 장치 |
|---|---|---|
| AI-DLC | 언제·누가 개입하는가 | 볼트 사이클, 페이즈 상태머신, 에스컬레이션 화이트리스트 |
| SDD | 무엇을 만드는가 | `specs/` = 단일 진실, EARS R#(§5 템플릿), G1 후 동결, constitution |
| TDD | 맞게 만들었는가 | RED→GREEN 강제, 테스트/구현 에이전트 분리, 훅의 물리 차단 |
| BDD/ATDD | 사용자 행위로 증명되는가 | S# = 실행되는 인수 테스트(바깥 루프) |
| 확장 게이트 | 테스트의 품질·보안·비기능은 | 뮤테이션, 속성 기반, 보안 3중, 비주얼, axe, 성능 예산, 플래그 |
| **협업 조정(R4)** | **여럿이 충돌 없이 굴러가는가** | **브랜치=작업권 선언, PR=게시판, 리뷰=게이트, WIP 제한, ADR** |

**자율성 공식**: 자율성의 총량 = 기계적 게이트의 밀도 × 인간 게이트의 신뢰도.
**협업 공식(R4)**: 조정 비용은 회의가 아니라 **리포지토리 안의 파일·브랜치·PR**로 지불한다 — 그래야 모든 팀원의 Claude Code가 같은 사실을 읽는다.

### 0.2 인간 게이트 — PR 리뷰로, 단 기록은 파일로

- **G1 (명세 승인)** = 스펙만 담긴 **Draft PR에 대한 다른 팀원의 Approve**. 작성자의 Claude Code(`/bolt`)가 `gh pr view --json reviews`로 승인 사실을 확인하고, spec.md frontmatter에 `approved_by / approved_at / approved_sha`를 **스탬프 커밋**한다 — GitHub 리뷰 상태는 새 커밋으로 휘발되므로(아래 dismiss 정책), 영속 기록은 frontmatter가 담당한다.
- **G2 (출하 승인)** = 같은 PR이 Ready 상태에서 required checks 전부 green + **리뷰어의 최종 Approve**. 머지는 작성자나 승인자가 `gh pr merge --auto --squash`(ask 확인)로 merge queue에 넣는다.
- 리뷰어도 Claude Code를 쓴다: `/review <PR번호>`가 리뷰 브리프를 만들고, **판단과 제출만 사람**이 한다(§1-[5]).
- 1인 운용으로 축소할 때만 R3 방식(터미널 승인 + required approvals 0)으로 폴백한다 — CLAUDE.md에 현재 모드를 명시.

### 0.3 GitHub 역할 — 세 가지로 한정

1. **변경 이력(History)**: 커밋·브랜치·PR(감사 레코드)·태그·Release·브랜치 보호.
2. **CI/CD**: Actions(`gates/nightly/release.yml`), required checks, merge queue, 배포 트리거.
3. **협업 조정(R4 추가)**: PR 리뷰(=G1/G2), reviewer 지정, CODEOWNERS, Draft/Ready 상태. **조정 정보의 원본은 항상 리포지토리 파일**(spec frontmatter, tasks의 `touches:`)이고, GitHub UI는 그 표면이다.

**여전히 사용 금지(스코프 외)** — 생성하지도, 사용하지도 않는다:
- Issues / Discussions / Projects 워크플로 → 의도 수집은 `specs/_inbox/` 파일로(모든 팀원이 커밋 가능, 모든 Claude Code가 체크아웃에서 읽음)
- `@claude` 원격 트리거(claude.yml / claude-code-action) → 전원이 로컬 Claude Code를 쓰므로 불필요
- ISSUE_TEMPLATE, 라벨 체계, 프로젝트 보드
- 권한 강제: `gh issue *`, `gh secret *`, `gh repo delete`, `gh api`(통째)를 deny

### 0.4 에스컬레이션 화이트리스트 (이외에는 스스로 결정하고 Decision Log/ADR에 기록)

1. 요구사항이 서로 모순
2. 비가역 작업 — 운영 DB 변경 · 결제 · 배포 인프라
3. 시크릿/자격증명 부재
4. done-check 5연속 실패
5. 볼트 예산 초과 (tool_calls 400회 또는 wall-clock 120분 — `budget.json`에서 조정)
6. 조정 교착 — `touches:` 충돌이 30분 대기로 해소되지 않거나, main 병합 충돌을 스펙 기준으로 해석할 수 없을 때

### 0.5 팀 협업 모델 — 한 장 요약

- **작업권 = 게시된 touches**: 브랜치 자체는 `/spec`이 이미 push한다. 점유 선언의 완성은 `/bolt`의 **PLAN push**로 tasks.md의 `touches:` 글롭이 원격에 게시되는 순간이다. 동시 점유 경합은 PR 번호가 큰 쪽이 양보(임의지만 결정론적인 타이브레이크) 또는 에스컬레이션 ⑥.
- **게시판 = 열린 PR 목록**: "지금 누가 무엇을 하는가" = `gh pr list` + 각 PR의 spec frontmatter. 별도 보드 없음.
- **WIP 제한**: 1인당 in-progress 볼트 ≤ 1 (스펙 작성·리뷰 대기는 제한 외), 팀 전체 열린 구현 PR ≤ 인원수 + 2 (구현 PR = tasks.md가 원격에 게시된 PR — 스펙 단계 Draft는 제외). `/bolt` 진입 시 검사.
- **공유 기억**: 결정은 design.md Decision Log(볼트 내부) 또는 `docs/adr/`(볼트를 넘는 결정), 컴팩션 스냅샷은 design.md에 커밋 — 누구의 Claude Code든 같은 맥락을 복원한다.
- **개인/팀 설정 분리**: 팀 표준은 `.claude/settings.json`(커밋), 개인 취향은 `.claude/settings.local.json`(자동 gitignore) — 단 개인 설정으로 deny·훅을 약화하는 것은 constitution 위반.

---

## §1. 설치 지시 (Claude Code 수행분)

### 실행 프로토콜 — 설치를 시작하기 전에 읽어라

1. **근거는 이 문서뿐이다.** 외부 관행과 충돌하면 이 문서를 따른다.
2. **질문 금지.** 모호하면 합리적 기본값 + `[ASSUMED]` 태그를 CLAUDE.md 하단에 기록한다.
3. **치환 토큰 규약**: 이 문서의 `<TEST_CMD>` 류 꺾쇠 토큰은 [0]에서 확정한 실제 명령으로 전부 치환한다. 설치 마지막에 `grep -RnE "<[A-Z_]+>" .claude .github`가 **0건**임을 검증한다.
4. **settings.json은 주석 없는 유효 JSON**으로 생성한다(이 문서의 jsonc 표기는 설명용이다).
5. 생성 파일이 [F]의 골격을 가진 경우, 그 골격(필드명·섹션명)을 그대로 따른다 — 다른 팀원의 Claude Code와 훅이 그 이름으로 파싱한다.
6. 완료 보고는 [10]의 형식을 따른다.

### [0] 스택 감지

`package.json` / `pnpm-lock.yaml` / `pyproject.toml` / `requirements.txt` / `prisma/schema.prisma` / `docker-compose.yml` 등을 읽어 언어·프레임워크·테스트 러너·린터·타입체커·DB를 판별하고, 아래 변수를 확정해 훅·CI에 치환한다.

```
TEST_CMD          예: npx vitest run --reporter=dot   |  pytest -q
RELATED_TEST_CMD  변경 파일 연관 테스트만
LINT_CMD / FORMAT_CMD / TYPECHECK_CMD
E2E_CMD           CI 재시도 1회를 포함해 확정. 예: npx playwright test --retries=1 | pytest tests/e2e -q --reruns 1
MUTATION_CMD      예: npx stryker run --incremental   |  mutmut run
```

보안 도구는 스택 무관 고정: **gitleaks · semgrep · npm audit(또는 pip-audit)**. 로컬에 없으면 설치를 시도하고, 불가하면 해당 검사를 CI 전용으로 강등했다고 기록한다.
완전히 빈 프로젝트라면 Next.js(App Router) + TypeScript + vitest + Playwright을 `[ASSUMED]`로 채택하고 최소 스캐폴딩까지 생성한다.

### [1] 생성 목록 (전체)

```
CLAUDE.md                       # 운영 헌법 — /init 초안이 있으면 병합·증축 ([7])
.claude/settings.json           # 팀 표준: 모델·권한·훅 배선 ([2]) — 커밋
.claude/settings.local.json.example  # 개인 오버라이드 견본(커밋) — 실제 local.json은 각자 생성·자동 무시 확인
.claude/agents/                 # 서브에이전트 7개 ([3])
.claude/hooks/                  # 스크립트 7개 + spec-lint-words.txt, 전부 chmod +x ([4])
CHANGELOG.html                  # main 변경 이력의 사람용 뷰 — changelog.sh가 생성([4]), 커밋 대상·손편집 금지
.claude/commands/               # spec·bolt·review·ship·verify·status·handoff·retro
                                # (+ops-review 조건부) ([5])
.claude/state/                  # phase=IDLE · active-bolt(빈) · stop-retries=0 · budget.json
                                # → .gitignore에 .claude/state/ 추가 (개인 로컬 상태)
specs/constitution.md           # 불변 원칙 ([6])
specs/_inbox/README.md          # 의도 수집함 사용법 1쪽 — 팀원 누구나 .md로 제안
docs/adr/0001-record-decisions.md  # ADR 제도 자체를 첫 ADR로 ([6])
.github/workflows/              # gates.yml · nightly.yml · release.yml ([8]) — claude.yml 없음
.github/CODEOWNERS              # specs/** · .claude/** · docs/adr/** → 전 팀원 풀 ([8])
.devcontainer/devcontainer.json # 전 팀원 + CI 가 같은 상자 ([8])
src/lib/flags.ts 또는 config/flags.py  # 피처 플래그 + 만료일 주석 + 킬스위치
acceptance 골격                  # S#와 1:1 인수 테스트 자리 (E2E_CMD로 실행 가능)
lighthouse-budgets.json         # 비기능 예산 (웹 프로젝트일 때)
.semgrep/                       # constitution 보안 조항의 기계 번역 룰
.env.example                    # 필요한 변수 이름만 — 값은 절대 커밋 금지
```

### [2] `.claude/settings.json` 요구사항

아래는 설명용 jsonc — 실제 파일은 주석 제거, 패턴은 감지된 패키지 매니저·러너에 맞게 확정한다.

```jsonc
{
  "model": "claude-fable-5",
  "env": { "CLAUDE_CODE_SUBAGENT_MODEL": "claude-opus-4-8" },
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(npx vitest*)", "Bash(npx playwright*)", "Bash(npx tsc*)",
      "Bash(npx eslint*)", "Bash(npx prettier*)",
      "Bash(git add*)", "Bash(git commit*)", "Bash(git branch*)",
      "Bash(git switch*)", "Bash(git checkout*)", "Bash(git fetch*)",
      "Bash(git pull --rebase*)", "Bash(git worktree*)", "Bash(git show*)",
      "Bash(git log*)", "Bash(git ls-remote*)",
      "Bash(git merge*)", "Bash(git diff*)", "Bash(git status*)", "Bash(git hash-object*)",
      "Bash(grep*)", "Bash(rg*)", "Bash(jq*)", "Bash(find*)",
      "Bash(head*)", "Bash(tail*)", "Bash(wc*)", "Bash(echo*)",
      "Bash(gh pr view*)", "Bash(gh pr list*)", "Bash(gh pr diff*)",
      "Bash(gh pr checks*)", "Bash(gh run view*)",
      "Bash(mkdir*)", "Bash(ls*)", "Bash(cat*)"
    ],
    "ask": [
      "Bash(git push*)", "Bash(gh pr create*)", "Bash(gh pr merge*)",
      "Bash(gh pr review*)", "Bash(gh pr edit*)", "Bash(gh pr ready*)",
      "Bash(gh release create*)", "Bash(npm install*)",
      "Bash(npx prisma migrate deploy*)"
    ],
    "deny": [
      "Read(./.env*)", "Read(./secrets/**)",
      "Bash(sudo*)", "Bash(rm -rf /*)", "Bash(git push --force*)",
      "Bash(gh issue*)", "Bash(gh secret*)", "Bash(gh repo delete*)",
      "Bash(gh api*)"
    ]
  },
  "hooks": {
    "PreToolUse":  [{ "matcher": "Bash",                 "hooks": [{ "type": "command", "command": ".claude/hooks/guard.sh" }] }],
    "PostToolUse": [{ "matcher": "Edit|Write|MultiEdit", "hooks": [{ "type": "command", "command": ".claude/hooks/post-edit.sh",  "timeout": 180 }] }],
    "Stop":        [{ "hooks": [{ "type": "command", "command": ".claude/hooks/done-check.sh", "timeout": 600 }] }],
    "SessionStart":[{ "hooks": [{ "type": "command", "command": ".claude/hooks/session-start.sh" }] }],
    "PreCompact":  [{ "hooks": [{ "type": "command", "command": ".claude/hooks/pre-compact.sh" }] }]
  }
}
```

비고 ① `gh api`는 통째로 deny — 본 워크플로는 gh의 1급 서브커맨드만 사용한다. ② 검증자 모델 다양화가 필요하면 `env` 강제 변수를 제거하고 verifier 계열 frontmatter만 다른 모델로(기본은 전원 Opus 4.8). ③ 개인은 settings.local.json에서 allow를 **추가**할 수 있으나 deny 완화·훅 제거는 금지(constitution).

### [3] 서브에이전트 7개 — 각 frontmatter에 `model: claude-opus-4-8` 명시(이중 고정)

공통 서두: "너의 유일한 진실은 `specs/<활성 id>/` 디렉토리다."

- **spec-writer** — 터미널 인터뷰 또는 `specs/_inbox/<파일>` 흡수 → §5의 EARS 6형식으로 R#, 시나리오 S#, `[ASSUMED]` 작성 + S#별 인수 테스트 골격(BDD 바깥 루프). API 경로를 건드리는 스펙이면 **계약 절(`## 계약` 섹션 — OpenAPI 조각 또는 스키마 diff) 필수**. 완료 시 **G1 브리핑 팩**: ① 5줄 요약 ② 리스크·비가역 항목 ③ `[ASSUMED]` 전체 ④ (개정 시) 승인본 대비 diff 요약 — PR 본문 머리에 그대로 사용. 코드 수정 금지.
- **architect** — 승인된 spec → design.md(결정·데이터 모델·API 계약·Decision Log) + tasks.md([F] 골격, `touches:` 필수). **결정의 영향이 touches 밖이거나 둘 이상의 볼트에 적용되면 `docs/adr/`에 ADR을 추가**하고 design.md에서 링크.
- **test-designer** — R#를 실패하는 단위 테스트로(안쪽 루프). `(Invariant)` 형식의 R#는 fast-check/Hypothesis **속성 테스트**로. tools에서 구현 파일 수정 배제.
- **implementer** — 테스트를 통과시키는 최소 구현. 테스트·acceptance 파일 수정 금지(훅이 차단). 미완 기능은 피처 플래그 뒤에. origin/main 병합 충돌은 **spec.md를 기준으로** 해석해 해결하고, 해석 불가면 에스컬레이션 ⑥.
- **spec-verifier** — 읽기 전용. **블라인드 이중 검증**: ⓐ 구현을 열기 전에 spec만 읽고 verification.md `## 예측` 작성 → ⓑ 테스트 실행·코드 열람으로 `## 실측` → ⓒ 불일치는 그 자체로 FAIL.
- **code-reviewer** — 읽기 전용. 보안·성능·constitution 위반, 테스트 약화 흔적(expect 완화·skip·단언 삭제·스냅샷 무지성 갱신·검역 태그 남용) 탐지. **/review에서 리뷰어 측 1차 감사로도 호출**된다.
- **e2e-tester** — E2E_CMD로 S# 재현 + 비주얼 회귀(toHaveScreenshot) + axe. `@quarantine` 태그는 판정 제외·별도 절 기록. 증거를 verification.md에 첨부.

### [4] 훅 — 스크립트 7개. bash, stdin JSON은 jq 파싱. 차단 = exit 2 + stderr 사유(Claude에게 피드백됨)

**guard.sh** (PreToolUse:Bash)
- 파괴 명령 차단: rm -rf 루트류 · `git push --force` · `.env` 접근 · DROP/TRUNCATE · `gh issue|secret|repo delete|api`.
- phase 규율: GREEN 중 테스트·acceptance 파일 수정 차단 / G1 전(spec frontmatter `status: draft`인데 phase가 RED 이후) src 수정 차단.
- **스펙 동결**: 대상 spec.md의 frontmatter `status`가 `draft`가 아닌데 spec.md를 수정하려 하면 차단. 예외: diff가 frontmatter의 `status / approved_* / owner` 필드에 국한된 변경(스탬프·`--revise` 복귀·/handoff)은 허용 — 본문 동결은 유지된다. 개정은 `/spec --revise NNN`만이 status를 draft로 되돌린 뒤 PR 재승인으로 진행.
- **보호 경로**: `.claude/**` · `specs/constitution.md` · `docs/adr/**` 수정은 phase=AMEND에서만(진입은 사람이 터미널에서 "AMEND 승인" 명시, 머지는 CODEOWNERS 리뷰 필수).
- **조정 잠금**: 수정 경로가 `.claude/state/locks/`에 캐시된 **다른 볼트**의 `touches:` 글롭과 겹치면 차단 + "30분 대기 또는 에스컬레이션 ⑥" 안내. (캐시는 /bolt가 생성, session-start가 갱신 — 후발 점유자는 자기 ③ 검사로 차단되므로 일방향 staleness는 안전.)

**post-edit.sh** (PostToolUse) — 예산 30초
- gitleaks(변경 파일만) → FORMAT → LINT → TYPECHECK → RELATED_TEST. 실패 로그 stderr + exit 2.
- 부수: `.claude/state/budget.json`의 `tool_calls` +1.

**done-check.sh** (Stop) — 예산 8분
- active-bolt 없으면 exit 0. 있으면 순서대로: TYPECHECK·LINT·TEST 전체 → `semgrep scan --config p/ci --config .semgrep/ --error` → `spec-lint.sh <활성 spec>` → tasks.md 미완 0개 → verification.md `예측/실측/판정` 전 항목 PASS → 만료 플래그·만료 검역(`quarantined_at`+14일 초과) 경고. semgrep이 로컬에 없으면([0]의 강등 기록 전제) 경고만 남기고 통과 — CI의 verify 잡이 권위 사본으로 잡는다.
- **예산 검사**: tool_calls > 400 또는 경과 > 120분이면 phase=HOLD 기록, 인계 보고 출력 후 **exit 0**(에스컬레이션 ⑤ — 강제 지속이 아니라 사람 인계).
- 그 외 미충족 → 남은 항목 출력 + **exit 2**. stop-retries 5회 초과 시 exit 0 + 인계 보고.

**session-start.sh** (SessionStart)
- stdout JSON `additionalContext`로 3~6줄 주입: phase · active-bolt · tasks 잔여 · 마지막 컴팩션 스냅샷 위치 · **열린 팀 PR 수 + locks 캐시 갱신(열린 PR들의 touches 재수집)**. 네트워크 호출은 베스트 에포트 — 실패해도 차단하지 않는다(항상 exit 0).

**pre-compact.sh** (PreCompact)
- design.md에 `### 컴팩션 스냅샷 <ISO timestamp>` 절 append: phase, 완료/잔여 태스크, 미해결 결정, 다음 행동 1줄. design.md는 커밋 대상이므로 **팀 공유 기억**이 된다.

**spec-lint.sh** (이벤트 훅 아님 — /spec·done-check·CI가 호출하는 결정론 검사기)
- 검사 항목(전부 기계 판정): ① 모든 R#가 §5 정규식 `^R[0-9]+ \((Ubiquitous|Event|State|Optional|Unwanted|Invariant)\):` 에 부합 ② `.claude/hooks/spec-lint-words.txt`의 모호어 미사용 ③ 모든 R# ↔ 최소 1개 S# 링크(`covers: R#` 역참조) ④ S#별 acceptance 골격 파일 존재 ⑤ frontmatter 필수 필드([F]) 존재 ⑥ spec 본문(R#·S#)에 API 엔드포인트 패턴(`/api/` 경로 또는 HTTP 메서드+경로) 감지 시 `## 계약` 섹션 존재 — 스펙 시점에는 tasks.md가 없으므로 spec 자체에서 감지한다. 실패 = exit 2 + 항목 목록.
- `spec-lint-words.txt` 초기값(팀이 PR로 증감): 적절히, 적당히, 빠르게, 신속히, 유연하게, 가능하면, 최대한, 충분히, 잘, 효율적으로, 직관적, 사용자 친화적, 등, 기타.

**changelog.sh** (R4.1 · 이벤트 훅 아님 — /ship·main 직접 커밋 예외·수동 호출되는 결정론 생성기)
- git log(main 계보)를 사람이 읽는 `CHANGELOG.html`로 렌더한다. **단일 진실은 git log, HTML은 파생물** — 손편집 금지, 병합 충돌·엔트리 누락은 재생성으로 자가 치유.
- `--pending "제목"`: 이번에 main에 쌓일 예정 엔트리를 맨 위에 선반영 — 그 커밋이 자기 자신의 changelog를 품게 한다.
- 계보 선택: main 위(직접 커밋 예외 경로) = 로컬 main, 브랜치 위(/ship 표준 경로) = origin/main + pending.
- 엔트리 단위는 main 커밋(= PR squash)이다 — 브랜치 WIP 커밋은 squash에서 소멸하므로 대상 아님.

작성 후: `chmod +x`, `bash -n`, `echo '{}' |` 스모크 테스트. **주의 — 훅 스크립트가 변경되면 각 팀원이 자기 세션에서 `/hooks` 재승인을 해야 한다**(보안 설계). 훅 변경 PR 본문에 이 사실을 명시하라.

### [5] 커맨드 (전부 `.claude/commands/*.md`)

- **/spec** `<설명 | _inbox/파일명>` — **NNN 할당**: `git fetch origin` 후 `specs/` 디렉토리와 origin의 `feat/*` 브랜치에서 최대 번호+1(충돌 시 늦게 push한 쪽이 자동 재번호). 질문 일괄(객관식 1회, 터미널) 또는 인박스 흡수 → spec.md+acceptance 골격 → spec-lint 통과 → 브랜치 `feat/NNN-slug` 생성·커밋·push(ask) → **Draft PR 생성(ask)** — 본문 = G1 브리핑 팩 → "리뷰어 지정 후 G1을 기다리세요" 안내 후 종료. 코드 금지. `--revise NNN`: status를 draft로 되돌리고 새 브랜치 `feat/NNN-rev2`(회차 증가)+새 Draft PR로 동일 절차 재승인 — 이미 머지된 스펙의 개정도 같은 길.
- **/bolt** `NNN` — 순서대로 검증: ① spec frontmatter `status: approved` + `approved_sha` 일치(없으면 `gh pr view`로 승인 리뷰 확인 후 `status: approved` + 스탬프를 기록·커밋 — push는 ④의 PLAN push에 합산; 일치 검사는 `git hash-object spec.md` ↔ approved_sha 대조) ② WIP 한도(내 in-progress 볼트 0개 = 1인 1볼트, 팀 열린 구현 PR ≤ 인원+2 — 구현 PR = tasks.md 게시된 PR) ③ **조정 충돌**: 열린 PR 전수(`gh pr list --json number,headRefName`)의 tasks.md `touches:`를 `git fetch origin <branch> && git show FETCH_HEAD:specs/*/tasks.md`로 수집해 내 글롭과 교집합 검사(tasks.md가 아직 없는 스펙 단계 PR은 검사 제외) — 충돌 시 30분 대기 1회 후 에스컬레이션 ⑥ ④ PLAN: design.md·tasks.md(touches 필수)·필요시 ADR 작성 → **PLAN push 1회(ask)** — tasks.md가 원격에 게시되는 이 순간이 점유 선언의 완성이다(이 push가 없으면 타 팀원의 ③ 검사가 이 볼트를 보지 못한다) → push 직후 fetch로 ③을 1회 재검사: 동시 점유가 드러나면 PR 번호가 큰 쪽이 양보하거나 에스컬레이션 ⑥ → 내 touches를 `.claude/state/locks/NNN.paths`에 캐시. **이 PLAN push가 볼트의 마지막 ask다 — RED부터 /ship 전까지 push·확인 프롬프트 0회의 무중단 자율 구간**. 이후 RED(인수+단위 실패 확인)→GREEN→REFACTOR→(`git fetch origin && git merge origin/main` — squash 머지이므로 병합 커밋은 이력 부담 없음, force-push 불요)→VERIFY(블라인드)→REVIEW 무중단, 페이즈마다 state 갱신, 커밋 규약 `feat(NNN): 요약`. 직접 구현 금지·위임만. 에스컬레이션 외 질문 금지.
- **/review** `<PR번호>` — **리뷰어 측 진입점**(리뷰어의 Claude Code에서 실행). `gh pr diff`·spec·verification.md를 읽고: ① spec-lint 재실행 ② code-reviewer 위임 감사 ③ 블라인드 예측↔실측 표 대조 ④ "승인 권고 / 변경 요청 권고 + 근거 3줄" 브리프 출력. **판단은 사람** — 사람이 결정하면 `gh pr review --approve|--request-changes --body <브리프>`를 ask로 제출. 같은 명령이 단계를 자동 판별한다: PR이 Draft(스펙만)면 ①과 의도·리스크 검토만 수행(G1 모드 — verification.md가 아직 없으므로 ③ 생략), Ready면 ①~④ 전체(G2 모드).
- **/ship** `NNN` — 순서가 곧 안전장치다: ① `changelog.sh --pending "<PR제목>"`으로 CHANGELOG.html 재생성 후 최종 커밋 일괄 push(verification.md 완성본 + CHANGELOG.html 포함 — **이 시점 이후 커밋 push 금지**) ② PR 본문을 종합 보고로 갱신(`gh pr edit --body` — 커밋이 아니므로 승인을 휘발시키지 않음): verification 요약·게이트 상태·`[ASSUMED]` 변경·플래그 목록 ③ `gh pr ready`(ask) ④ required checks green 확인 ⑤ 리뷰어에게 G2 요청 안내 ⑥ Approve 확인 후 `gh pr merge --auto --squash`(ask)로 merge queue 진입 — **G2 승인 이후 어떤 커밋도 push하지 않는다**(dismiss stale이 승인을 휘발시킨다) ⑦ 머지 확인 후 locks·active-bolt·phase 초기화. 출하 여부는 frontmatter가 아니라 **PR 머지 사실**로 판별한다(/status가 gh로 표시).
- **/verify** `NNN` — VERIFY·REVIEW만 재실행(예측 절 보존, 실측만 갱신).
- **/status** — 내 phase·볼트·예산 소진율 + **팀 보드**: `gh pr list` 기반 [PR# / 볼트 / owner / Draft·Ready / checks] 표. 수정 금지.
- **/handoff** `NNN <인수자>` — 컴팩션 스냅샷을 design.md에 강제 기록 → spec frontmatter `owner` 갱신 → push → 내 로컬 state·locks 정리. 인수자는 `/bolt NNN`으로 이어받는다(SessionStart가 맥락 주입).
- **/retro** — 분기 1회, 사람 호출: Decision Log·ADR·검역 목록·nightly 지표를 모아 constitution/프로세스 개정안을 **AMEND PR 초안**으로 제안(채택은 리뷰).
- **/ops-review** *(관측성 연동이 있을 때만 생성)* — Sentry/PostHog 등에서 에러 클러스터·퍼널 이상을 읽어 `specs/_inbox/ops-<날짜>-<주제>.md`로 커밋. 운영 데이터가 다음 스펙이 되는 입구.

### [6] `specs/constitution.md` — 불변 원칙에 반드시 포함

- 스택 결정 사항, 코딩 컨벤션, 보안 절대선(.env·시크릿·PII), `.env.example`만 커밋.
- "스펙과 코드가 모순되면 코드를 우회하지 않는다. `/spec --revise`(G1 재승인)로만 해결한다."
- 트렁크 기반: 장수 브랜치 금지(볼트 = 며칠 이내), 미완 기능은 피처 플래그 뒤로, 플래그는 만료일 주석 필수.
- 품질 기준선: 변경분 뮤테이션 점수, axe serious 0건, 성능 예산 준수, 시크릿 0건. 커버리지 %는 목표 금지(굿하트).
- **DoR/DoD 명문화**: Definition of Ready = spec-lint 통과 + 브리핑 팩 + G1 스탬프. Definition of Done = done-check 전 항목 + required checks green + G2.
- **flaky 검역 정책**: CI 재시도 1회로도 비결정적이면 `@quarantine` 태그 + `specs/_inbox/flaky-<이름>.md`(필드: test, quarantined_at, owner) → required 경로 제외, nightly에서 계속 실행, **14일 내 수리 또는 삭제**. 남용은 code-reviewer 적발 대상. 태그 방식: 테스트 제목에 문자열 `@quarantine` — gates는 제외(grep-invert/exclude), nightly는 그것만 선별 실행(러너별 플래그는 [0]에서 확정).
- **WIP 제한**(0.5)과 **ADR 제도**: 볼트를 넘는 결정은 `docs/adr/NNNN-제목.md`(Context/Decision/Consequences/관련 볼트) — 구두·채팅 결정은 무효.
- **계약 우선**: API·스키마를 바꾸는 스펙은 계약 절 필수, 계약 테스트가 RED에 포함, 스키마 변경은 expand→migrate→contract.
- **공급망**: Actions는 SHA 핀(`uses: owner/repo@<sha> # vX.Y.Z`), `npm ci`/lockfile 기반, 패키지 추가는 ask.
- **연속 CHANGELOG (R4.1)**: main에 쌓이는 모든 커밋은 같은 커밋 안에 `changelog.sh`로 재생성된 `CHANGELOG.html`을 동반한다 — 사람이 변경 이력을 코드 없이 본다. 표준 경로는 /ship ①(--pending으로 자기 엔트리 선반영), main 직접 커밋이 허용되는 예외 상황도 동일. 손편집 금지, 충돌은 재생성으로 해소. release.yml(태그 시점 릴리스 노트)과 상보적 — CHANGELOG.html은 연속 뷰.
- **GitHub 스코프 조항**: §0.3 전문 수록. 개인 settings.local.json으로 deny·훅 약화 금지.

### [7] `CLAUDE.md` — 운영 헌법에 반드시 포함

- 오케스트레이터 수칙: 직접 구현 금지·위임 원칙·페이즈 상태머신 표(§2)·1볼트=1세션(/clear).
- **모드 선언: `mode: team`** (R3 솔로 폴백 시 `mode: solo`와 게이트 차이 1줄).
- 의도의 입구는 둘: 터미널 대화, `specs/_inbox/`. 협업 조정은 §0.5 모델.
- G1·G2 정의(0.2), 에스컬레이션 6종(0.4), `[ASSUMED]` 규약, AMEND 절차, /handoff 절차.
- 팀 수칙: 작업 시작 시 `git fetch`로 main 최신화, 리뷰 요청을 받으면 24시간 내 `/review`, 훅 변경 PR은 본문에 "전원 /hooks 재승인" 명시.

### [8] GitHub 산출물 — History + CI/CD + 협업 조정

**`.github/workflows/gates.yml`**

```yaml
name: gates
on:
  pull_request:
  merge_group:                  # merge queue 직렬화
  push: { branches: [main] }
concurrency:
  group: gates-${{ github.ref }}
  cancel-in-progress: true
permissions: { contents: read }
jobs:
  verify:                       # done-check.sh의 우회 불가 사본
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<ACTION_SHA>            # v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@<ACTION_SHA>          # v4 / Python이면 setup-python
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: <TYPECHECK_CMD>
      - run: <LINT_CMD>
      - run: bash .claude/hooks/spec-lint.sh --all
      - run: <TEST_CMD>                            # @quarantine 제외
      - uses: gitleaks/gitleaks-action@<ACTION_SHA>     # v2
        env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
      - run: pipx run semgrep scan --config p/ci --config .semgrep/ --error
      - run: npm audit --audit-level=high
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@<ACTION_SHA>
      - uses: actions/setup-node@<ACTION_SHA>
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: <E2E_CMD>                             # 재시도 1회는 [0]에서 명령에 포함, @quarantine 제외
      - uses: actions/upload-artifact@<ACTION_SHA>
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }
  budgets:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<ACTION_SHA>
      - uses: actions/setup-node@<ACTION_SHA>
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci && npm run build
      - run: npx lhci autorun
      - run: npx size-limit
  mutation-diff:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@<ACTION_SHA>
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@<ACTION_SHA>
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: <MUTATION_CMD>                        # 변경분만 — 전체는 nightly
```

**`nightly.yml`** — cron(UTC 18시 = KST 03시)+workflow_dispatch. 전체 뮤테이션, `npm audit --audit-level=moderate`, 검역 테스트 전체 실행. 결과(뮤테이션 점수·검역 수·감사)를 `$GITHUB_STEP_SUMMARY` + artifact로. **이슈 생성 금지.**

**`release.yml`** — 태그 `v*` push 시 conventional commits → CHANGELOG → `gh release create --notes-file`. SemVer: feat=minor, fix=patch, BREAKING=major. 태그는 사람이 ask로. (워크플로에 `permissions: contents: write` 필요)

**배포** — main 머지가 트리거(트렁크 기반): Vercel류 Git 연동이면 자동, 자체 파이프라인이면 gates의 push(main) 성공 후 deploy 잡을 감지 스택에 맞게 `[ASSUMED]`로 생성. 릴리스는 피처 플래그 토글로 분리하고, 사고 시 플래그 off가 재배포보다 빠른 킬스위치다.

**`CODEOWNERS`** — `specs/** .claude/** docs/adr/**` → `@팀핸들들`(설치 시 git 원격에서 수집하거나 `[ASSUMED]`로 placeholder).

**브랜치 보호(main)** — 사람(관리자) 1회 설정 체크리스트:
- Require a pull request before merging
- Required status checks: `verify · e2e · budgets` (mutation-diff는 안정 후 승격)
- **Required approvals: 1** + **Dismiss stale approvals: ON**(새 커밋이 승인 휘발 — G1 기록은 frontmatter 스탬프가 보존하므로 안전)
- Require review from Code Owners(specs·헌법·ADR 보호)
- Merge queue 활성화, linear history, force-push 차단
- Repo 일반 설정: **Allow auto-merge ON**(`gh pr merge --auto`의 전제) + squash 머지만 허용

**`.devcontainer/devcontainer.json`** — Node 20(또는 감지 스택)+필수 도구, postCreate `npm ci && npx playwright install --with-deps`. 전 팀원과 CI가 같은 상자.

**생성하지 않는 것(명시)**: `claude.yml`/claude-code-action, ISSUE_TEMPLATE, Discussions·Projects 설정, 라벨 체계.

### [9] 기존 코드가 있는 리포지토리라면 추가로

- `specs/000-baseline/spec.md`에 현재 동작을 역명세화(EARS 형식으로).
- 핵심 사용자 플로우 3~5개의 characterization 테스트로 현재 동작 고정.

### [F] 파일 규격 — 골격을 그대로 따를 것 (훅·타 팀원 Claude Code가 이 이름으로 파싱)

**spec.md frontmatter**
```yaml
---
id: 014
title: 게스트 장바구니 병합
status: draft          # draft → approved 두 값뿐. 출하는 PR 머지 사실로 판별(frontmatter에 안 둠). --revise가 draft 복귀
owner: "@minsu"        # GitHub 핸들
approved_by: null      # G1 시 /bolt가 스탬프
approved_at: null      # ISO 8601
approved_sha: null     # 승인 시점 spec.md의 git blob SHA — 동결 검증 기준
---
```

**tasks.md frontmatter**
```yaml
---
bolt: 014
owner: "@minsu"
touches:               # 이 볼트의 점유 범위 — 조정 충돌 검사의 근거
  - "src/cart/**"
  - "src/app/api/cart/**"
---
- [ ] T1 (R1,R2) 장바구니 병합 도메인 함수 — 테스트 먼저
- [ ] T2 (S1) 로그인 병합 acceptance 통과
```

**verification.md 골격**
```md
# Verification — 014
## 예측 (구현 미열람 · spec만 근거)
- R1: <기대 동작 / 기대 테스트 결과>
## 실측
- R1: PASS — <테스트 파일·실행 결과>
## 판정
| R# | 예측↔실측 일치 | 최종 |
|---|---|---|
## e2e 증거
## 검역 제외 목록
```

**`specs/_inbox/` 파일 머리**: `kind: idea|bug|ops`, `by:`, `date:`, (bug면) 재현 절차·기대 vs 실제.

### [10] 자가 검증 후 보고

- `ls -R .claude specs docs .github` / settings.json `jq` 파싱(주석 0) / 에이전트 7개 `model:` grep / 훅 7개 실행권한·`bash -n` / 워크플로 YAML 파싱(actionlint 또는 python yaml) / `grep -RnE "<[A-Z_]+>" .claude .github` **0건** / `gh auth status`(미인증도 보고만).
- **금지 산출물 부재 확인**: `claude.yml`·`ISSUE_TEMPLATE` 없음 명시 검증.
- 산출물 전체를 단일 커밋 `chore: bootstrap autonomous stack (R4)`으로 커밋한다(push는 사람의 ask 확인).
- 보고 형식: 생성 파일 목록 / 감지 스택·치환 명령 / `[ASSUMED]` 목록 / **사람(관리자) 1회 설정**: ① 브랜치 보호+merge queue 체크리스트 ② CODEOWNERS 핸들 확정 ③ 팀원 온보딩 안내(부록 B) / "재시작 → /hooks 승인 → /spec부터".

---

## §2. 볼트 워크플로 (운영 정의)

| phase | 의미 | 강제 장치 |
|---|---|---|
| IDLE → SPEC | `/spec` 진행 | spec-lint, 질문 일괄 1회, NNN 원자 할당 |
| GATE1 | Draft PR에 타 팀원 Approve → /bolt가 frontmatter 스탬프 | 승인 리뷰 부재 시 /bolt 진입 불가 |
| PLAN | design/tasks(`touches:`) + 필요시 ADR → **PLAN push = 점유 게시** | 진입 검사(WIP·충돌) + push 후 재검사, locks 캐시 |
| RED | 인수(S#)+단위(R#) 실패 확인 | 테스트 먼저 — implementer 미투입 |
| GREEN | 최소 구현 | 테스트·acceptance 수정 차단(guard) |
| REFACTOR | 정리 + origin/main 병합(fetch+merge) | 충돌 해석은 spec 기준 |
| VERIFY | 블라인드 예측→실측, e2e·비주얼·axe | verification.md 매트릭스 |
| REVIEW | code-reviewer 감사 | 테스트 약화·검역 남용 적발 |
| GATE2 | `/ship` → Ready → checks green → 타 팀원 Approve → merge queue | required checks + approvals 1 |
| SHIPPED | squash 머지 = main = 배포, 릴리스 = 플래그 | merge queue 직렬화 |

**팀 시나리오 예시 (지민 = 작성자, 수아 = 리뷰어, 둘 다 Claude Code)**
1. 수아가 `specs/_inbox/idea-게스트장바구니.md` 커밋·push.
2. 지민: `/spec _inbox/idea-게스트장바구니.md` → 질문 일괄 답변 → Draft PR #41 생성.
3. 수아: `/review 41` → 브리프 검토 → `gh pr review --approve`(ask). **= G1.**
4. 지민: `/bolt 014` → 스탬프+PLAN push(점유 확정) → 자율 주행(수 시간, 무중단).
5. 지민: `/ship 014` → Ready, checks green, 수아에게 G2 요청.
6. 수아: `/review 41` → 최종 브리프 → Approve. 지민: `gh pr merge --auto --squash`(ask). **= G2.**
7. merge queue 통과 → main = 배포, 기능은 플래그 off 상태 → 점진 공개.

## §3. 게이트 예산표

| 슬롯 | 예산(강제 수단) | 검사 |
|---|---|---|
| post-edit 훅 | ≤30초 (timeout 180의 1/6 목표) | 포맷·린트·타입·관련 테스트·gitleaks(변경분) |
| done-check 훅 | ≤8분 (timeout 600) | 전체 테스트·semgrep·spec-lint·tasks/verification·만료(플래그·검역)·예산 |
| PR CI gates.yml | ≤25분 (잡별 timeout-minutes + concurrency 취소) | e2e·비주얼·axe·성능 예산·의존성·변경분 뮤테이션 |
| nightly | 무제한 | 전체 뮤테이션·전체 감사·검역 테스트·지표 요약 |
| G1·G2 (사람) | ~15분 / 24h SLA | 브리핑 팩 / 리뷰 브리프 검토 — 형식은 기계가 이미 검사 |

## §4. 보강 ↔ 빈틈 추적표 (R3→R4 누적)

| # | 빈틈 | 봉합 장치 |
|---|---|---|
| ① | 명세=가치 미증명 | `/ops-review` → `specs/_inbox/` 운영 피드백 루프 |
| ② | 검증자 동질성 | 블라인드 이중 검증 + 모델 다양화 옵션([2] 비고) + **타인 리뷰(G1/G2가 곧 이종 검증)** |
| ③ | G1 러버스탬프 | spec-lint + G1 브리핑 팩 + 리뷰 브리프(/review) |
| ④ | 스택 거버넌스 | 보호 경로·AMEND PR·CODEOWNERS·분기 /retro |
| ⑤ | 병렬 볼트 충돌 | `touches:` 선언 + 브랜치=점유 + /bolt 교집합 검사 + merge queue |
| ⑥ | flaky 정지 | 재시도 1회 + @quarantine(14일 만료·nightly 감시·owner 지정) |
| ⑦ | 비용 폭주 | budget.json 계측 + done-check 예산 + 에스컬레이션 ⑤ |
| ⑧ | 긴 주행 기억 | SessionStart 주입 + PreCompact 스냅샷(design.md = 팀 공유) |
| ⑨ | **다인 게이트 휘발성** | frontmatter 승인 스탬프(approved_sha) — 리뷰 상태와 독립 |
| ⑩ | **누가 무엇을 하나** | 브랜치=작업권, PR 목록=게시판, /status 팀 보드 |
| ⑪ | **리뷰 부하 비대칭** | /review — 리뷰어의 Claude Code가 1차 감사, 사람은 판단만 |
| ⑫ | **결정의 휘발(채팅 결정)** | ADR 제도 — 구두 결정 무효 조항 |
| ⑬ | **개인 설정 드리프트** | settings.local.json 허용 + deny·훅 약화 금지 조항 |
| ⑭ | **WIP 폭주·리뷰 적체** | WIP 한도(/bolt 검사) + 24h 리뷰 SLA + /handoff |

## §5. EARS 템플릿 (spec-writer·spec-lint의 공통 규격)

표기: `R<번호> (<형식>): <문장>` — 형식은 아래 6종, spec-lint가 정규식으로 강제.

| 형식 | 한국어 템플릿 | 예 |
|---|---|---|
| Ubiquitous | 시스템은 항상 ~해야 한다 | R1 (Ubiquitous): 시스템은 항상 장바구니 합계를 서버에서 계산해야 한다 |
| Event | ~하면, 시스템은 ~해야 한다 | R2 (Event): 게스트가 로그인하면, 시스템은 두 장바구니를 수량 합산으로 병합해야 한다 |
| State | ~인 동안, 시스템은 ~해야 한다 | R3 (State): 재고가 0인 동안, 시스템은 담기 버튼을 비활성화해야 한다 |
| Optional | ~기능이 있는 환경에서는 ~ | R4 (Optional): 쿠폰 모듈이 켜진 환경에서는, 시스템은 병합 후 쿠폰을 재검증해야 한다 |
| Unwanted | ~인 경우에도, 시스템은 ~ | R5 (Unwanted): 병합 중 오류가 나는 경우에도, 시스템은 어느 장바구니도 유실하지 않아야 한다 |
| Invariant | (속성) ~는 ~와 무관하게 같아야 한다 | R6 (Invariant): 합계는 담는 순서와 무관하게 같아야 한다 → 속성 테스트 의무 |

시나리오: `S<번호> (covers: R2,R5): Given/When/Then …` — covers가 R#↔S# 링크의 기계 근거.

---

## 부록 A — 관리자 1회 셋업

```bash
gh repo create … && git push -u origin main      # 또는 기존 repo
# 이 문서를 repo 루트에 AUTONOMOUS-STACK-REFERENCE.md 로 커밋
claude --model claude-fable-5
/init                                            # 기존 코드가 있다면 1차 스캔(선택)
# → "이 참조 문서의 §1 설치 지시를 그대로 수행하라"
#   (claude가 산출물 커밋 후 push를 제안 — ask 확인으로 업로드)
exit && claude --model claude-fable-5            # 에이전트 로드 재시작
/hooks                                           # 훅 1회 승인
# GitHub: 브랜치 보호+merge queue+CODEOWNERS ([8] 체크리스트), 팀원 초대
```

## 부록 B — 팀원 온보딩 (5분)

```bash
git clone <repo> && cd <repo>
# devcontainer 사용 시: 컨테이너로 열기 (도구 자동 설치)
gh auth login
claude --model claude-fable-5                    # 커밋된 .claude/* 자동 인식
/hooks                                           # 본인 세션에서 훅 승인(필수)
git config user.name "<핸들>" && git config user.email "<메일>"   # 커밋 식별
/status                                          # 팀 보드 확인 → /review 또는 /spec 부터
```
