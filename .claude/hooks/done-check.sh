#!/usr/bin/env bash
# done-check.sh — Stop 훅: 볼트 완료 판정 (예산 8분)
# 미충족 = exit 2(작업 계속). 예산 초과/5연속 실패 = exit 0 + 사람 인계(에스컬레이션 ⑤/④).
set -uo pipefail

INPUT=$(cat)
export HOOK_INPUT="$INPUT"

ACTIVE=$(cat .claude/state/active-bolt 2>/dev/null || true)
[ -z "$ACTIVE" ] && exit 0

SPEC_DIR=$(ls -d specs/"$ACTIVE"-* 2>/dev/null | head -1)
RETRY_F=.claude/state/stop-retries

# ── 예산 검사 (에스컬레이션 ⑤: 강제 지속이 아니라 HOLD + 인계) ──
B=.claude/state/budget.json
TC=0
STARTED=""
if [ -f "$B" ]; then
  if command -v jq >/dev/null 2>&1; then
    TC=$(jq -r '.tool_calls // 0' "$B" 2>/dev/null || echo 0)
    STARTED=$(jq -r '.started_at // empty' "$B" 2>/dev/null || true)
  else
    TC=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("tool_calls",0))' "$B" 2>/dev/null || echo 0)
    STARTED=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("started_at") or "")' "$B" 2>/dev/null || true)
  fi
fi
ELAPSED=0
if [ -n "$STARTED" ]; then
  S=$(date -d "$STARTED" +%s 2>/dev/null || echo 0)
  [ "$S" -gt 0 ] && ELAPSED=$(( ($(date +%s) - S) / 60 ))
fi
if [ "${TC:-0}" -gt 400 ] || [ "$ELAPSED" -gt 120 ]; then
  printf 'HOLD' > .claude/state/phase
  {
    echo "done-check: 볼트 예산 초과(tool_calls=$TC/400, 경과=${ELAPSED}/120분) — phase=HOLD (에스컬레이션 ⑤)"
    echo "인계 보고: 사람이 /status 확인 후 재개(/bolt $ACTIVE), 분할(/spec --revise) 또는 /handoff 결정"
  } >&2
  exit 0
fi

FAILS=()
chk() {
  local label=$1 out
  shift
  if ! out=$("$@" 2>&1); then
    FAILS+=("[$label] $(printf '%s' "$out" | tail -12 | tr '\n' ' ')")
  fi
}

# 전체 게이트
if [ -d node_modules ]; then
  chk TYPECHECK npx tsc --noEmit
  chk LINT npx eslint .
  chk TEST npx vitest run --reporter=dot -t '^(?!.*@quarantine)'
else
  FAILS+=("[ENV] node_modules 없음 — npm ci 필요")
fi

if command -v semgrep >/dev/null 2>&1; then
  chk SEMGREP semgrep scan --quiet --error --config p/ci --config .semgrep/ .
else
  echo "done-check 경고: semgrep 로컬 부재 — CI verify 잡이 권위 사본으로 검사" >&2
fi

[ -n "$SPEC_DIR" ] && chk SPEC_LINT bash .claude/hooks/spec-lint.sh "$SPEC_DIR" \
  || FAILS+=("[SPEC] specs/${ACTIVE}-* 디렉토리 없음")

# tasks.md 미완 0개
if [ -n "$SPEC_DIR" ] && [ -f "$SPEC_DIR/tasks.md" ]; then
  N=$(grep -c '^- \[ \]' "$SPEC_DIR/tasks.md" 2>/dev/null || true)
  [ "${N:-0}" -gt 0 ] && FAILS+=("[TASKS] 미완 태스크 ${N}개 — tasks.md")
else
  FAILS+=("[TASKS] tasks.md 없음 — PLAN 페이즈 미완")
fi

# verification.md — 예측/실측/판정 + R# 전 항목 PASS
V="$SPEC_DIR/verification.md"
if [ -n "$SPEC_DIR" ] && [ -f "$V" ]; then
  for sec in '## 예측' '## 실측' '## 판정'; do
    grep -q "^$sec" "$V" || FAILS+=("[VERIFY] '$sec' 절 없음")
  done
  grep -qE 'FAIL|불일치' "$V" && FAILS+=("[VERIFY] FAIL/불일치 항목 존재 — 블라인드 검증 불일치는 그 자체로 FAIL")
  if [ -f "$SPEC_DIR/spec.md" ]; then
    while IFS= read -r R; do
      grep -E "^[-*|[:space:]]*${R}[:|, ]" "$V" | grep -q 'PASS' \
        || FAILS+=("[VERIFY] $R 실측 PASS 기록 없음")
    done < <(grep -oE '^R[0-9]+' "$SPEC_DIR/spec.md" | sort -u)
  fi
else
  FAILS+=("[VERIFY] verification.md 없음 — VERIFY 페이즈 미완")
fi

# 만료 경고 (차단 아님)
TODAY=$(date +%F)
while IFS= read -r d; do
  [ -n "$d" ] && [ "$d" \< "$TODAY" ] \
    && echo "done-check 경고: 만료 피처 플래그(expires: $d) — src/lib/flags.ts 정리(constitution)" >&2
done < <(grep -ohE 'expires: [0-9]{4}-[0-9]{2}-[0-9]{2}' src/lib/flags.ts 2>/dev/null | awk '{print $2}')

for f in specs/_inbox/flaky-*.md; do
  [ -e "$f" ] || continue
  QD=$(grep -oE 'quarantined_at:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}' "$f" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
  if [ -n "$QD" ]; then
    LIM=$(date -d "$QD +14 days" +%F 2>/dev/null || true)
    [ -n "$LIM" ] && [ "$LIM" \< "$TODAY" ] \
      && echo "done-check 경고: 검역 14일 초과 — $f 수리 또는 삭제(constitution)" >&2
  fi
done

# ── 판정 ──
RET=$(cat "$RETRY_F" 2>/dev/null || echo 0)
if [ "${#FAILS[@]}" -gt 0 ]; then
  RET=$((RET + 1))
  printf '%s' "$RET" > "$RETRY_F"
  if [ "$RET" -gt 5 ]; then
    {
      echo "done-check: 5회 연속 미충족 — 에스컬레이션 ④(사람 인계). 잔여 항목:"
      printf ' - %s\n' "${FAILS[@]}"
    } >&2
    printf '0' > "$RETRY_F"
    exit 0
  fi
  {
    echo "done-check 미충족(시도 ${RET}/5) — 아래를 해소하라:"
    printf ' - %s\n' "${FAILS[@]}"
  } >&2
  exit 2
fi

printf '0' > "$RETRY_F"
exit 0
