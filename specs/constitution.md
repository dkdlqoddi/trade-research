# Constitution — 불변 원칙

이 문서는 보호 경로다. 개정은 AMEND 절차(사람의 "AMEND 승인" → phase=AMEND → PR + CODEOWNERS 리뷰)로만.

## 1. 스택 결정

- Next.js(App Router) + TypeScript + vitest + Playwright `[ASSUMED — 빈 프로젝트 기본값, R4 §1-[0]]`
- 테스트: vitest(단위·속성/fast-check) · Playwright(인수/acceptance, 비주얼, axe) · Stryker(뮤테이션)
- 보안 3중: gitleaks · semgrep(`p/ci` + `.semgrep/`) · npm audit
- 패키지 매니저 npm, Node 22, 전원·CI 동일 상자는 `.devcontainer/`가 보장

## 2. 코딩 컨벤션

- TypeScript strict. 포맷 = prettier, 린트 = eslint(next/core-web-vitals + next/typescript) — 스타일 논쟁은 도구 출력이 종결한다.
- 커밋: `feat(NNN): 요약` / `spec(NNN):` / `plan(NNN):` / `handoff(NNN):` / `chore:` — squash 머지가 PR 단위로 이력을 정리한다.

## 3. 보안 절대선

- `.env`·시크릿·자격증명·PII를 코드/커밋/로그에 절대 남기지 않는다. **`.env.example`(이름만)만 커밋.**
- 동적 코드 실행(eval/new Function), 문자열 결합 셸 명령, dangerouslySetInnerHTML 금지(`.semgrep/constitution.yml`이 기계 강제).
- 운영 DB 변경·결제·배포 인프라 = 비가역 작업 = 에스컬레이션 ②(사람).

## 4. 스펙 우선

**스펙과 코드가 모순되면 코드를 우회하지 않는다. `/spec --revise`(G1 재승인)로만 해결한다.**
specs/ = 단일 진실. G1 후 spec 본문 동결(guard 훅이 물리 차단, 스탬프 필드 제외).

## 5. 트렁크 기반

- 장수 브랜치 금지 — 볼트는 며칠 이내. 늘어지면 분할(/spec --revise)하거나 /handoff.
- 미완 기능은 피처 플래그(`src/lib/flags.ts`) 뒤로. **플래그는 만료일 주석(`expires: YYYY-MM-DD`) 필수** — done-check가 만료를 경고. 킬스위치(`NEXT_PUBLIC_FLAGS_KILL_SWITCH=1`)가 사고 시 1차 복구 수단.
- main 머지 = 배포 트리거. 릴리스 = 플래그 토글로 분리.

## 6. 품질 기준선

- 변경분 뮤테이션 점수(mutation-diff) 하락 없음 · axe serious/critical 0건 · 성능 예산(lighthouse-budgets.json·size-limit) 준수 · 시크릿 0건
- **커버리지 %는 목표로 삼지 않는다**(굿하트의 법칙 — 숫자가 목표가 되면 숫자만 좋아진다).

## 7. DoR / DoD

- **Definition of Ready**(볼트 진입 가능): spec-lint 통과 + G1 브리핑 팩 + G1 스탬프(approved_sha)
- **Definition of Done**(출하 가능): done-check 전 항목 + required checks green + G2 Approve

## 8. flaky 검역 정책

- CI 재시도 1회로도 비결정적이면: 테스트 제목에 `@quarantine` 문자열 + `specs/_inbox/flaky-<이름>.md`(test / quarantined_at / owner) 생성
- 검역 테스트는 required 경로에서 제외(vitest `-t '^(?!.*@quarantine)'`, playwright `--grep-invert @quarantine`), nightly가 계속 실행
- **14일 내 수리 또는 삭제.** 남용(flaky 아닌 실패의 격리행)은 code-reviewer 적발 대상.

## 9. WIP 제한과 ADR

- 1인당 in-progress 볼트 ≤ 1(스펙 작성·리뷰 대기는 제한 외) · 팀 전체 열린 구현 PR ≤ 인원수 + 2. `/bolt` 진입 시 검사.
- **볼트를 넘는 결정은 `docs/adr/NNNN-제목.md`**(Context/Decision/Consequences/관련 볼트). **구두·채팅 결정은 무효.**

## 10. 계약 우선

- API·스키마를 바꾸는 스펙은 `## 계약` 절 필수(spec-lint 강제). 계약 테스트가 RED에 포함.
- 스키마 변경은 expand → migrate → contract — 한 볼트에서 expand와 contract를 동시에 하지 않는다.

## 11. 공급망

- GitHub Actions는 SHA 핀(`uses: owner/repo@<sha> # vX.Y.Z`)
- `npm ci` / lockfile 기반 — lockfile 없는 설치 금지. **패키지 추가는 ask**(사람 확인).

## 12. GitHub 스코프 (§0.3 전문)

GitHub의 역할은 셋뿐이다:
1. **변경 이력**: 커밋·브랜치·PR(감사 레코드)·태그·Release·브랜치 보호
2. **CI/CD**: Actions(gates/nightly/release.yml), required checks, merge queue, 배포 트리거
3. **협업 조정**: PR 리뷰(=G1/G2), reviewer 지정, CODEOWNERS, Draft/Ready. 조정 정보의 **원본은 항상 리포지토리 파일**(spec frontmatter, tasks의 touches) — GitHub UI는 표면.

**사용 금지(생성도, 사용도)**: Issues / Discussions / Projects / 라벨 / ISSUE_TEMPLATE / `@claude` 원격 트리거(claude.yml). 의도 수집은 `specs/_inbox/`로. 권한도 deny: `gh issue *` · `gh secret *` · `gh repo delete` · `gh api`(통째).

## 13. 연속 CHANGELOG (R4.1)

- **main에 쌓이는 모든 커밋은 같은 커밋 안에 재생성된 `CHANGELOG.html`을 동반한다** — 사람이 git 없이 변경 이력을 본다.
- 생성기는 `.claude/hooks/changelog.sh`가 유일하다. **단일 진실은 git log, HTML은 파생물** — 손편집 금지(다음 재생성이 덮는다).
- 표준 경로: `/ship ①`에서 `changelog.sh --pending "<PR제목>"` 실행 → squash 커밋이 자기 엔트리를 품는다. main 직접 커밋이 허용되는 예외 상황(솔로 폴백·부트스트랩·AMEND)도 커밋 직전 동일하게 실행한다.
- 병합 충돌·엔트리 누락은 고치지 말고 **재생성으로 해소**한다(이력에서 다시 그려지므로 자가 치유).
- `release.yml`(태그 시점 릴리스 노트)과 상보적 — CHANGELOG.html은 태그 사이를 포함한 연속 뷰다.

## 14. 설정 거버넌스

- 팀 표준 = `.claude/settings.json`(커밋) · 개인 취향 = `.claude/settings.local.json`(자동 gitignore)
- 개인 설정으로 allow **추가**는 가능하나 **deny 완화·훅 제거·약화는 constitution 위반**이다.
