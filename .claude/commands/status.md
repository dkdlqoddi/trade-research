---
description: 내 볼트 상태 + 팀 보드(열린 PR 기반). 읽기 전용 — 어떤 파일도 수정하지 않는다.
---

# /status

**읽기 전용.** 상태 파일·스펙·코드를 일절 수정하지 않는다.

## 내 상태

```bash
cat .claude/state/phase .claude/state/active-bolt 2>/dev/null
cat .claude/state/budget.json 2>/dev/null
```
- 예산 소진율 계산: tool_calls/400, (now − started_at)/120분 — % 로 표시
- 활성 볼트 있으면: `specs/NNN-*/tasks.md` 잔여 태스크 수, 마지막 컴팩션 스냅샷 위치

## 팀 보드 (게시판 = 열린 PR 목록, §0.5)

```bash
git fetch origin --quiet
gh pr list --json number,title,isDraft,headRefName,author,statusCheckRollup
```

각 feat/* PR의 spec frontmatter(owner)와 tasks.md 존재 여부(= 구현 PR 여부)를 종합해 표 출력:

```
| PR# | 볼트 | owner | 단계(Draft/Ready) | checks | touches 요약 |
```

- 출하 여부는 **PR 머지 사실**로 판별(frontmatter 아님)
- WIP 신호: 열린 구현 PR > 인원수+2 면 경고 표시("리뷰 적체 — /bolt 진입 차단됨")
- 내 active-bolt와 locks 캐시(`.claude/state/locks/`)의 불일치(머지된 볼트의 잔존 락 등) 발견 시 보고만(정리는 사람 확인 후)
