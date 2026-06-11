#!/usr/bin/env bash
# session-start.sh — SessionStart: 맥락 3~6줄 주입 + 팀 locks 캐시 갱신
# 네트워크는 베스트 에포트 — 실패해도 차단하지 않는다. 항상 exit 0.
set -uo pipefail

PHASE=$(cat .claude/state/phase 2>/dev/null || printf 'IDLE')
ACTIVE=$(cat .claude/state/active-bolt 2>/dev/null || true)

# 리비전 드리프트 감지: REFERENCE_REV ↔ 참조 문서 헤더 버전 토큰
REVWARN=""
DOC_REV=$(grep -m1 -oE '^\*\*버전\*\* R[0-9]+' AUTONOMOUS-STACK-REFERENCE.md 2>/dev/null | grep -oE 'R[0-9]+' || true)
CUR_REV=$(cat .claude/REFERENCE_REV 2>/dev/null || true)
if [ -n "$DOC_REV" ] && [ "$CUR_REV" != "$DOC_REV" ]; then
  REVWARN="⚠ 재조정 필요: 산출물 리비전(${CUR_REV:-없음}) ≠ 참조 문서(${DOC_REV}) — AUTONOMOUS-STACK-REFERENCE.md 설치 절차의 재조정 모드 수행"
fi

SPEC_DIR=""
REM="-"
SNAP="없음"
if [ -n "$ACTIVE" ]; then
  SPEC_DIR=$(ls -d specs/"$ACTIVE"-* 2>/dev/null | head -1)
  if [ -n "$SPEC_DIR" ] && [ -f "$SPEC_DIR/tasks.md" ]; then
    REM=$(grep -c '^- \[ \]' "$SPEC_DIR/tasks.md" 2>/dev/null || true)
    REM=${REM:-0}
  fi
  if [ -n "$SPEC_DIR" ] && [ -f "$SPEC_DIR/design.md" ]; then
    LN=$(grep -n '^### 컴팩션 스냅샷' "$SPEC_DIR/design.md" 2>/dev/null | tail -1 | cut -d: -f1)
    [ -n "$LN" ] && SNAP="$SPEC_DIR/design.md:$LN"
  fi
fi

# 열린 팀 PR + 접수 대기 이슈 + locks 캐시 갱신 (touches 재수집)
PRS="?"
ISSUES="?"
if command -v gh >/dev/null 2>&1; then
  ILIST=$(timeout 10 gh issue list --json number --limit 100 2>/dev/null) || ILIST=""
  if [ -n "$ILIST" ]; then
    if command -v jq >/dev/null 2>&1; then
      ISSUES=$(printf '%s' "$ILIST" | jq 'length')
    else
      ISSUES=$(printf '%s' "$ILIST" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))' 2>/dev/null || echo "?")
    fi
  fi
  LIST=$(timeout 10 gh pr list --json number,headRefName --limit 50 2>/dev/null) || LIST=""
  if [ -n "$LIST" ]; then
    if command -v jq >/dev/null 2>&1; then
      PRS=$(printf '%s' "$LIST" | jq 'length')
      PAIRS=$(printf '%s' "$LIST" | jq -r '.[] | "\(.number)\t\(.headRefName)"')
    else
      PRS=$(printf '%s' "$LIST" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))' 2>/dev/null || echo "?")
      PAIRS=$(printf '%s' "$LIST" | python3 -c '
import json, sys
for p in json.load(sys.stdin):
    print(f"{p[\"number\"]}\t{p[\"headRefName\"]}")' 2>/dev/null || true)
    fi
    mkdir -p .claude/state/locks
    while IFS=$'\t' read -r NUM BR; do
      [ -z "${BR:-}" ] && continue
      case "$BR" in feat/*) : ;; *) continue ;; esac
      DIR=${BR#feat/}
      NNN=${DIR%%-*}
      [ -n "$ACTIVE" ] && [ "$NNN" = "$ACTIVE" ] && continue
      timeout 20 git fetch -q origin "$BR" 2>/dev/null || continue
      TK=$(git show "FETCH_HEAD:specs/$DIR/tasks.md" 2>/dev/null) || continue
      GL=$(printf '%s\n' "$TK" | awk '/^touches:/{f=1; next} f && /^[[:space:]]*-/{print} f && !/^[[:space:]]*-/{exit}' \
        | sed 's/^[[:space:]]*-[[:space:]]*//; s/^"//; s/"$//')
      [ -n "$GL" ] && printf '%s\n' "$GL" > ".claude/state/locks/$NNN.paths"
    done <<< "${PAIRS:-}"
  fi
fi

CTX="[스택 상태] phase=$PHASE | 활성 볼트=${ACTIVE:-없음} | tasks 잔여=$REM
마지막 컴팩션 스냅샷: $SNAP
열린 팀 PR: $PRS · 접수 대기 이슈: $ISSUES — 팀 보드는 /status, 작업 시작 전 git fetch origin"
[ -n "$REVWARN" ] && CTX="$CTX
$REVWARN"

if command -v jq >/dev/null 2>&1; then
  jq -n --arg c "$CTX" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}'
else
  python3 -c '
import json, sys
print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": sys.argv[1]}}, ensure_ascii=False))' "$CTX" 2>/dev/null || true
fi
exit 0
