---
description: 리뷰어 측 진입점 — PR을 감사해 승인/변경요청 권고 브리프 생성. 판단과 제출은 사람.
argument-hint: <PR번호>
---

# /review $ARGUMENTS

PR번호 = $ARGUMENTS. **리뷰어의 Claude Code에서 실행된다. 나는 권고까지만 — 판단·제출은 사람이 한다.**

## 0. 단계 자동 판별

```bash
gh pr view $ARGUMENTS --json isDraft,title,headRefName,files
```
- **Draft + 스펙만** (specs/·acceptance/ 변경뿐) → **G1 모드**: 아래 ①과 의도·리스크 검토만. verification.md가 아직 없으므로 ③ 생략.
- **Ready** → **G2 모드**: ①~④ 전체.

## ① spec-lint 재실행

```bash
git fetch origin <headRefName>
git worktree add /tmp/review-$ARGUMENTS FETCH_HEAD   # 체크아웃 오염 방지
cd /tmp/review-$ARGUMENTS && bash .claude/hooks/spec-lint.sh specs/<NNN-slug>
```
(작업 후 `git worktree remove /tmp/review-$ARGUMENTS`)

## ② code-reviewer 위임 감사

`gh pr diff $ARGUMENTS` + 스펙을 code-reviewer 서브에이전트에 전달 — 보안·constitution·**테스트 약화 흔적**(expect 완화·skip·단언 삭제·스냅샷 무지성 갱신·검역 남용) 중점.

## ③ 블라인드 예측↔실측 대조 (G2만)

verification.md의 `## 예측`이 구현 열람 전 작성됐는지 정황 검토(예측이 실측 문구를 복붙한 흔적 = 적신호), `## 판정` 표에서 불일치·FAIL 확인, e2e 증거 실재 확인.

## ④ 리뷰 브리프 출력

```
## 리뷰 브리프 — PR #N (G1|G2)
- spec-lint: PASS|FAIL
- 감사 BLOCK n건 / WARN n건: <요약>
- (G2) 예측↔실측: 일치|불일치 <근거>
- (G1) 의도·리스크: <5줄 요약에 대한 평가, [ASSUMED] 타당성>
**권고: 승인 | 변경 요청** — 근거 3줄
```

## ⑤ 사람의 판단 → 제출

사람이 결정을 말하면 그때만:
```bash
gh pr review $ARGUMENTS --approve --body "<브리프>"            # ask
gh pr review $ARGUMENTS --request-changes --body "<브리프>"    # ask
```
사람의 명시 결정 없이 제출 금지. 24시간 내 응답이 팀 SLA(CLAUDE.md).
