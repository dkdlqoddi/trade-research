---
description: 작성자 측 변경 요청 처리 — 수거 → 분류 → 수정 → 조치 코멘트 → 재리뷰 요청.
argument-hint: <PR번호>
---

# /address $ARGUMENTS

PR번호 = $ARGUMENTS. 리뷰어의 변경 요청을 작성자 측에서 반영하는 루프다.

## ① 수거

```bash
gh pr view $ARGUMENTS --comments
gh pr view $ARGUMENTS --json reviews
```
브리프 규약상 변경 요청은 **리뷰 본문 최상위의 번호 체크리스트**다(인라인 스레드는 보조) — `gh api`가 deny이므로 이 두 명령만으로 전량 수거 가능해야 하고, 누락 의심이면 리뷰어에게 체크리스트 보완을 요청한다.

## ② 분류

- **스펙 자체의 변경**(R#/S#의 의미가 바뀜) → `/spec --revise NNN` 안내 후 **중단** — 구현으로 스펙 드리프트를 흡수하지 않는다.
- **구현·테스트 수정** → 해당 페이즈로 복귀(테스트 변경 = RED, 구현 = GREEN, 정리 = REFACTOR) 후 서브에이전트 위임으로 수정.

## ③ 커밋·push

```bash
git commit -m "fix(NNN): <요청 항목 요약>"
git push        # ask — G2 승인 전이므로 허용(승인 후라면 push 금지, /ship 규칙)
```

## ④ 조치 내역 코멘트

항목별 ✔/사유를 PR 코멘트(ask)로:

```
## /address 조치 내역
1. ✔ <요청> — <커밋 SHA>
2. ✖ <요청> — 사유: 스펙 변경 필요(--revise 안내)
```

## ⑤ 재리뷰 요청

`gh pr edit $ARGUMENTS --add-reviewer <리뷰어>` (ask)

**단계 정합**: G1 변경 요청 = 스펙이 draft이므로 자유 수정·push 후 재요청. G2 변경 요청 = 수정 push가 dismiss stale로 기존 승인을 자동 휘발 → 재승인(별도 규칙 불요). **G2 승인 후**의 요청은 /ship의 "머지 대기 중 main 전진" 유일 예외 규칙만 따른다.
