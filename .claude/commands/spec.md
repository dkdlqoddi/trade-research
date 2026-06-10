---
description: 의도 → EARS 스펙 → Draft PR (G1 대기까지). 코드 금지.
argument-hint: <설명 | _inbox/파일명 | --revise NNN>
---

# /spec $ARGUMENTS

phase를 SPEC으로: `echo -n "SPEC" > .claude/state/phase`

## 0. 모드 판별

- 인자가 `--revise NNN`이면 → **개정 모드** (아래 §개정)
- 인자가 `_inbox/...`이면 → 해당 파일을 읽어 의도로 삼는다 (인터뷰 생략 가능, 부족분만 질문)
- 그 외 → 터미널 인터뷰

## 1. NNN 원자 할당

```bash
git fetch origin
# specs/ 디렉토리 최대 번호와 origin의 feat/* 브랜치 최대 번호 중 큰 쪽 + 1
ls -d specs/[0-9]* 2>/dev/null; git branch -r --list 'origin/feat/*'
```
세 자리 0패딩(예: 001). 충돌 시 늦게 push한 쪽이 자동 재번호.

## 2. 질문 일괄 (터미널, 객관식 1회)

모호점을 **한 번에** 객관식으로 묻는다(AskUserQuestion, 최대 4문항). 두 번째 질문 라운드 금지 — 남는 모호점은 합리적 기본값 + `[ASSUMED]`로 spec에 기록.

## 3. spec-writer 위임

spec-writer 서브에이전트에 위임: `specs/NNN-slug/spec.md` + `acceptance/NNN-slug/S*.spec.ts` 골격 작성 (frontmatter는 [F] 골격, status: draft, owner는 `git config user.name` 기준 GitHub 핸들).

## 4. 검증

```bash
bash .claude/hooks/spec-lint.sh specs/NNN-slug
```
FAIL이면 spec-writer에 수정 재위임(통과까지).

## 5. 브랜치·커밋·push·Draft PR

```bash
git switch -c feat/NNN-slug
git add specs/NNN-slug acceptance/NNN-slug
git commit -m "spec(NNN): <제목>"
git push -u origin feat/NNN-slug        # ask
gh pr create --draft --title "spec(NNN): <제목>" --body "<G1 브리핑 팩>"   # ask
```
PR 본문 = spec-writer의 G1 브리핑 팩(① 5줄 요약 ② 리스크·비가역 ③ [ASSUMED] 전체 ④ 개정 시 diff 요약).

## 6. 종료

phase를 GATE1로: `echo -n "GATE1" > .claude/state/phase`
안내 출력: "리뷰어를 지정하고 G1(다른 팀원의 /review NNN → Approve)을 기다리세요. 승인 후 /bolt NNN."
**여기서 멈춘다 — 코드 작성 금지, /bolt 자동 진입 금지.**

## §개정 (--revise NNN)

이미 승인/머지된 스펙의 본문 변경은 이 길뿐이다:
1. 기존 spec.md frontmatter `status: approved` → `draft` 복귀(Edit로 status 필드만 — guard가 허용하는 예외)
2. 회차 증가 브랜치: `git switch -c feat/NNN-rev2` (rev 숫자는 기존 rev 최대+1)
3. spec-writer에 개정 위임 → spec-lint → 커밋·push(ask) → **새 Draft PR**(본문에 ④ 승인본 대비 diff 요약 필수)
4. 동일하게 G1 재승인 대기. approved_* 필드는 /bolt가 재스탬프.
