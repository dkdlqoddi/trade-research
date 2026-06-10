---
description: 볼트 출하 — 최종 push, PR 종합 보고, Ready, G2 승인 후 merge queue. 순서가 곧 안전장치.
argument-hint: NNN
---

# /ship $ARGUMENTS

NNN = $ARGUMENTS. done-check 통과 상태가 전제. **순서를 바꾸면 안전장치가 무너진다** — dismiss stale 정책 때문에 G2 승인 후 커밋 push는 승인을 휘발시킨다.

## ① CHANGELOG 재생성 + 최종 커밋 일괄 push

1. `bash .claude/hooks/changelog.sh --pending "<이 PR의 제목>"` — main 이력 + 이 볼트 엔트리로 CHANGELOG.html 재생성 (constitution §13: main에 쌓이는 모든 커밋은 changelog를 동반)
2. CHANGELOG.html에 이 PR 제목이 들어갔는지 grep으로 확인
3. verification.md 완성본 + CHANGELOG.html 포함 전부 커밋 → `git push` (ask)

**이 시점 이후 이 PR에 커밋 push 금지.** 수정이 필요해지면 push 전으로 되돌아온 것 — G2를 다시 받는다(CHANGELOG도 그때 재생성).

## ② PR 본문을 종합 보고로 갱신

`gh pr edit <PR번호> --body "<종합 보고>"` (ask) — 커밋이 아니므로 승인을 휘발시키지 않는다:
- verification 요약(판정 표), 게이트 상태(done-check·로컬 게이트)
- `[ASSUMED]` 변경분, 이 볼트의 피처 플래그 목록(만료일 포함)
- 검역 제외 목록

## ③ Ready 전환

`gh pr ready <PR번호>` (ask)

## ④ required checks green 확인

`gh pr checks <PR번호> --watch` — verify·e2e·budgets 전부 green까지. red면 원인 파악 후 수정이 필요하면 ①로 복귀(= G2 재요청).

## ⑤ G2 요청

리뷰어에게 안내 출력: "checks green — /review <PR번호> 로 최종 검토 요청 (24h SLA)".

## ⑥ Approve 확인 후 merge queue

`gh pr view <PR번호> --json reviews`로 최종 APPROVED 확인 →
`gh pr merge <PR번호> --auto --squash` (ask) — merge queue 진입.
**G2 승인 이후 어떤 커밋도 push하지 않는다.**

## ⑦ 머지 확인 후 정리

```bash
gh pr view <PR번호> --json state   # MERGED 확인
rm -f .claude/state/locks/NNN.paths
: > .claude/state/active-bolt
echo -n "IDLE" > .claude/state/phase
git switch main && git pull --rebase
```
출하 여부의 진실은 frontmatter가 아니라 **PR 머지 사실**이다(/status가 gh로 표시). main 머지 = 배포 트리거, 릴리스는 피처 플래그 토글로 점진 공개 — 사고 시 킬스위치(NEXT_PUBLIC_FLAGS_KILL_SWITCH=1)가 재배포보다 빠르다.
