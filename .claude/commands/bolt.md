---
description: G1 승인된 스펙의 볼트 실행 — PLAN push(점유 게시) 후 RED→GREEN→REFACTOR→VERIFY→REVIEW 무중단 자율 주행.
argument-hint: NNN
---

# /bolt $ARGUMENTS

NNN = $ARGUMENTS. SPEC_DIR = `specs/NNN-*`. 진입 검증 ①~③을 통과해야 PLAN을 시작한다.
**직접 구현 금지 — 서브에이전트 위임만. 에스컬레이션 화이트리스트(CLAUDE.md) 외 질문 금지.**

## ① G1 승인 확인 + 스탬프

```bash
git fetch origin && git merge origin/main   # 최신화
```
- spec.md frontmatter가 이미 `status: approved`면: `git hash-object specs/NNN-*/spec.md` ↔ `approved_sha` 일치 검사. 불일치 = 승인 후 본문 변조 → 중단, /spec --revise 안내.
- 아직 `draft`면: `gh pr view <PR번호> --json reviews`로 **APPROVED 리뷰** 확인. 없으면 중단("G1 미승인 — 리뷰어의 /review 대기").
  있으면 스탬프(영속 기록 — GitHub 리뷰 상태는 새 커밋으로 휘발되므로 frontmatter가 원본):
  1. 먼저 스탬프 반영 후 SHA가 바뀌므로, **스탬프 전 본문 blob SHA**를 기준으로 한다: `git hash-object specs/NNN-*/spec.md` 기록
  2. Edit로 frontmatter만: `status: approved`, `approved_by: "@리뷰어"`, `approved_at: <ISO8601>`, `approved_sha: <위 SHA>`
  3. `git commit -m "spec(NNN): G1 stamp"` — push는 ④ PLAN push에 합산

## ② WIP 한도

- 내 in-progress 볼트 = 0이어야 함(`.claude/state/active-bolt`가 비어 있어야 — 1인 1볼트)
- 팀 열린 **구현 PR**(tasks.md가 원격에 게시된 PR) ≤ 팀 인원수 + 2. 초과면 중단("리뷰 적체 — /review부터").

## ③ 조정 충돌 검사

```bash
gh pr list --json number,headRefName
# 각 feat/* 브랜치: git fetch origin <branch> && git show FETCH_HEAD:specs/<dir>/tasks.md
```
열린 PR 전수의 `touches:` 글롭을 수집해 **내 예정 touches와 교집합 검사** (tasks.md 없는 스펙 단계 PR은 제외). 충돌 시: 30분 대기 1회 → 재검사 → 여전히 충돌이면 에스컬레이션 ⑥(사람 호출).

## ④ PLAN — 점유 선언의 완성

phase=PLAN 기록. `.claude/state/budget.json`의 `started_at`을 현재 ISO8601로, `tool_calls`를 0으로 리셋.
1. **architect 위임** → design.md + tasks.md(`touches:` 필수) + 필요시 ADR
2. **PLAN push 1회(ask)**: `git add specs/NNN-* docs/adr && git commit -m "plan(NNN): design+tasks" && git push`
   — tasks.md가 원격에 게시되는 이 순간이 점유 선언의 완성이다(이 push 없으면 타 팀원의 ③이 이 볼트를 못 본다)
3. push 직후 `git fetch origin`으로 ③ 재검사 1회 — 동시 점유 발견 시 **PR 번호 큰 쪽이 양보**(결정론 타이브레이크) 또는 에스컬레이션 ⑥
4. 내 touches를 `.claude/state/locks/NNN.paths`에 캐시(글롭 1줄 1개)
5. `echo -n "NNN" > .claude/state/active-bolt`
6. PR '진행' 절에 tasks T# 체크리스트 미러: `gh pr edit <PR번호> --body "<갱신 본문>"` (ask — PLAN push에 합산되는 1회)

**이 PLAN push가 볼트의 마지막 ask다 — 이후 /ship 전까지 push·확인 프롬프트 0회 무중단 자율 구간.**

## ⑤ RED → ⑨ REVIEW (무중단)

페이즈마다 `.claude/state/phase` 갱신. 커밋 규약 `feat(NNN): 요약` (페이즈별 잦은 커밋, push는 안 함).

- **RED**: test-designer 위임 → 단위 테스트(R#별, Invariant는 속성 테스트). 인수(S#)+단위 테스트 **실패 확인**이 산출물.
- **GREEN**: implementer 위임 → 최소 구현. guard가 테스트·acceptance 수정을 물리 차단. 미완 기능은 플래그 뒤로.
- **REFACTOR**: implementer 위임 → 정리. 이후 `git fetch origin && git merge origin/main`(squash 머지 운용이라 병합 커밋 부담 없음, force-push 불요). 충돌은 spec.md 기준 해석 — 해석 불가면 에스컬레이션 ⑥. **CHANGELOG.html 충돌은 예외**: 해석 불요 — `bash .claude/hooks/changelog.sh --pending "<PR제목>"` 재실행으로 해소(파생물 재생성, constitution §13).
- **VERIFY**: spec-verifier 위임(블라인드: 예측 → 실측 → 판정) + e2e-tester 위임(S# 재현·비주얼·axe·증거 첨부). 불일치 = FAIL = GREEN 복귀.
- **REVIEW**: code-reviewer 위임. BLOCK 발견 시 implementer로 수정 루프(테스트 약화 방향은 금지).

done-check(Stop 훅)가 전 게이트를 기계 판정한다. 통과하면 안내: "/ship NNN 로 출하 절차 시작".

**진행 가시성** — 진행의 진실은 로컬(.claude/state + design.md 컴팩션 스냅샷). **1일 초과 볼트는 일 1회 WIP push 권장**(ask 1회/일 — 미승인 단계라 승인 휘발 무해, 팀이 diff로 진행을 본다).
