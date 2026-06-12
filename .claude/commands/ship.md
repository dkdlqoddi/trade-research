---
description: 볼트 출하 9단계 — 최종 push, PR 종합 보고, Ready, G2 승인 후 auto-merge 예약(직렬화 장치), 이슈 출하 코멘트, 정리. 순서가 곧 안전장치.
argument-hint: NNN
---

# /ship $ARGUMENTS

NNN = $ARGUMENTS. done-check 통과 상태가 전제. **순서를 바꾸면 안전장치가 무너진다** — dismiss stale 정책 때문에 G2 승인 후 커밋 push는 승인을 휘발시킨다.

**PR 제목 = squash 커밋 제목**: `feat|fix|chore(NNN): 한 줄 요약` — release.yml 체인지로그가 이를 소비한다.

## ① CHANGELOG 재생성 + 최종 커밋 일괄 push

1. `bash .claude/hooks/changelog.sh --pending "<이 PR의 제목>"` — main 이력 + 이 볼트 엔트리로 CHANGELOG.html 재생성(constitution §13)
2. CHANGELOG.html에 이 PR 제목이 들어갔는지 grep으로 확인
3. verification.md 완성본 + CHANGELOG.html 포함 전부 커밋 → `git push` (ask)

**이 시점 이후 이 PR에 커밋 push 금지.** 수정이 필요해지면 ①로 되돌아온 것 — G2를 다시 받는다(CHANGELOG도 재생성).

## ② PR 본문을 표준 골격(PULL_REQUEST_TEMPLATE 절 구성)으로 갱신

`gh pr edit <PR번호> --body "<종합 보고>"` (ask) — 커밋이 아니므로 승인을 휘발시키지 않는다:
`Closes #N` / **요약**(결과 요약으로 갱신) / **진행**(tasks T# 완료 표시) / **검증**(verification 발췌: R# | 판정 | 증거) / **시각 증거**(CI run 아티팩트 링크) / **변경 범위**(touches·마이그레이션·플래그명+만료일) / **체크리스트**(게이트 green · [ASSUMED] 반영 · 검증서 PASS)

## ③ Ready 전환

`gh pr ready <PR번호>` (ask)

## ④ required checks green 확인

`gh pr checks <PR번호> --watch` — required checks(`verify`·`e2e`·`budgets`) 전부 green까지. `mutation-diff`는 non-required 참고 잡 — 머지를 막지는 않지만 변경분 뮤테이션 하락 없음은 constitution §6 기준선이므로 red면 아래 분류·기록을 동일 적용한다.

**CI red 처리** — `gh run view --log-failed` 수거 → 분류:
- **코드 결함** → 해당 페이즈 복귀·수정 → ①로(재생성·push = G2 재요청)
- **flaky 의심** → 검역 절차(`@quarantine` + `specs/_inbox/flaky-*.md`, 14일 내 수리)
- **인프라**(타임아웃·런너) → `gh run rerun` (ask) 1회
분류 근거는 PR '진행' 절에 한 줄 기록.

## ⑤ G2 요청

리뷰어에게 안내: "checks green — /review <PR번호> 로 최종 검토 요청 (24h SLA)".

## ⑥ Approve 확인 후 auto-merge 예약

`gh pr view <PR번호> --json reviews`로 최종 APPROVED 확인(**솔로 폴백**: 타 팀원 Approve 대신 운영자 터미널 승인 — required approvals 0이라 예약 절차는 동일) → `gh pr merge <PR번호> --auto --squash` (ask) — 집행·직렬화는 **직렬화 장치**가 담당(표준 = auto-merge + 브랜치 보호 "Require branches to be up to date" / EC 조직은 merge queue 대체 가능).
**G2 승인 이후 어떤 커밋도 push하지 않는다.**

**머지 대기 중 main 전진(out-of-date·충돌) = 유일 예외** — 직렬화 장치의 어느 형태든 같은 처리: `git fetch origin && git merge origin/main` 병합 커밋 **하나만** push(기능 변경 절대 금지) → 승인 휘발 → 리뷰어에게 "충돌 해소만 — 재승인 요청" 코멘트(ask) → 재 `--auto`. diff가 병합 커밋뿐임은 리뷰어 측 /review가 확인한다.

## ⑦ 머지 확인 후 상태 정리

```bash
gh pr view <PR번호> --json state   # MERGED 확인
rm -f .claude/state/locks/NNN.paths
: > .claude/state/active-bolt
echo -n "IDLE" > .claude/state/phase
git switch main && git pull --rebase
```
출하 여부의 진실은 frontmatter가 아니라 **PR 머지 사실**이다(/status가 표시). main 머지 = 배포 트리거, 릴리스는 피처 플래그 토글 — 사고 시 킬스위치(`NEXT_PUBLIC_FLAGS_KILL_SWITCH=1`)가 재배포보다 빠르다.

## ⑧ 발원 이슈에 출하 코멘트

`gh issue comment N --body "<결과 한 줄 · PR 링크 · 플래그명과 현재 on/off>"` (ask) — 요청자가 이슈에서 결과를 본다. (`issue: null`인 솔로 볼트는 생략. 이슈 close 자체는 머지의 `Closes #N`이 이미 했다.)

## ⑨ 로컬 정리

해당 worktree·로컬 브랜치 삭제(원격 브랜치는 자동 삭제 설정). 릴리스 노트가 필요한 시점이면 태그 `v*` push는 **사람이** ask로 — release.yml이 CHANGELOG → Release 생성(SemVer: feat=minor, fix=patch, BREAKING=major).
