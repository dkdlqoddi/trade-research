#!/usr/bin/env bash
# pre-compact.sh — PreCompact: 컴팩션 스냅샷을 design.md에 영속화 (§17)
# design.md는 커밋 대상 = 팀 공유 기억. 항상 exit 0.
set -uo pipefail

INPUT=$(cat) || true

ACTIVE=$(cat .claude/state/active-bolt 2>/dev/null || true)
[ -z "$ACTIVE" ] && exit 0
SPEC_DIR=$(ls -d specs/"$ACTIVE"-* 2>/dev/null | head -1)
[ -z "$SPEC_DIR" ] && exit 0

D="$SPEC_DIR/design.md"
[ -f "$D" ] || touch "$D"
PHASE=$(cat .claude/state/phase 2>/dev/null || printf 'IDLE')

DONE=$(grep -c '^- \[x\]' "$SPEC_DIR/tasks.md" 2>/dev/null || true)
REM=$(grep -c '^- \[ \]' "$SPEC_DIR/tasks.md" 2>/dev/null || true)
NEXT=$(grep -m1 '^- \[ \]' "$SPEC_DIR/tasks.md" 2>/dev/null | sed 's/^- \[ \] //' || true)

{
  echo ""
  echo "### 컴팩션 스냅샷 $(date -Iseconds)"
  echo "- phase: $PHASE"
  echo "- tasks: 완료 ${DONE:-0} / 잔여 ${REM:-0}"
  echo "- 다음 행동: ${NEXT:-잔여 태스크 없음 — done-check 통과 후 /ship $ACTIVE}"
  echo "- 미해결 결정: Decision Log(상단) 참조 — 새 결정은 그쪽에 추가하고 여기엔 요약만"
} >> "$D"

exit 0
