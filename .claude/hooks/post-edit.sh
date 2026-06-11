#!/usr/bin/env bash
# post-edit.sh — PostToolUse(Edit|Write|MultiEdit) 즉시 게이트 (예산 30초)
# gitleaks(변경 파일) → FORMAT → LINT → TYPECHECK → RELATED_TEST. 실패 = exit 2.
# 부수효과: budget.json tool_calls +1
set -uo pipefail

INPUT=$(cat)
export HOOK_INPUT="$INPUT"

jget() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$INPUT" | jq -r "$1 // empty" 2>/dev/null
  else
    python3 -c '
import json, os, sys
try:
    d = json.loads(os.environ.get("HOOK_INPUT") or "{}")
except Exception:
    d = {}
for k in sys.argv[1].strip(".").split("."):
    d = d.get(k) if isinstance(d, dict) else None
print(d if isinstance(d, str) else "")' "$1" 2>/dev/null
  fi
}

# 예산 계측 +1
B=.claude/state/budget.json
mkdir -p .claude/state
if [ -f "$B" ]; then
  if command -v jq >/dev/null 2>&1; then
    jq '.tool_calls += 1' "$B" > "$B.tmp" 2>/dev/null && mv "$B.tmp" "$B"
  else
    python3 -c '
import json, sys
p = sys.argv[1]
try:
    d = json.load(open(p))
    d["tool_calls"] = int(d.get("tool_calls", 0)) + 1
    json.dump(d, open(p, "w"), indent=2, ensure_ascii=False)
except Exception:
    pass' "$B" 2>/dev/null
  fi
fi

FILE=$(jget .tool_input.file_path)
[ -z "$FILE" ] && exit 0
CWD=$(jget .cwd)
[ -z "$CWD" ] && CWD=$PWD
REL=${FILE#"$CWD"/}
PHASE=$(cat .claude/state/phase 2>/dev/null || printf 'IDLE')

# gitleaks — 변경 파일만 (로컬 부재 시 스킵: CI verify가 권위)
if command -v gitleaks >/dev/null 2>&1 && [ -f "$FILE" ]; then
  if ! OUT=$(gitleaks detect --no-git --no-banner --source "$FILE" 2>&1); then
    printf 'post-edit: gitleaks 시크릿 의심 — 즉시 제거하라:\n%s\n' "$OUT" | tail -20 >&2
    exit 2
  fi
fi

# 코드 파일만 코드 게이트
case "$REL" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) : ;;
  *) exit 0 ;;
esac

if [ ! -d node_modules ]; then
  echo "post-edit: node_modules 없음 — 코드 게이트 스킵(npm ci 필요, CI verify가 권위)" >&2
  exit 0
fi

FAILS=""
run() {
  local label=$1 out
  shift
  if ! out=$("$@" 2>&1); then
    FAILS="${FAILS}
[${label}]
$(printf '%s' "$out" | tail -25)"
  fi
}

run FORMAT npx prettier --log-level warn --write "$FILE"
run LINT npx eslint --no-warn-ignored "$FILE"
run TYPECHECK npx tsc --noEmit

# RED 페이즈는 실패하는 테스트가 목적 — 관련 테스트 실행 생략
if [ "$PHASE" != "RED" ]; then
  case "$REL" in
    acceptance/*) : ;; # e2e는 post-edit 예산(30초) 밖 — VERIFY 단계에서
    *) run RELATED_TEST npx vitest related --run --reporter=dot "$REL" -t '^(?!.*@quarantine)' ;;
  esac
fi

if [ -n "$FAILS" ]; then
  printf 'post-edit 게이트 실패 — 수정 후 계속:%s\n' "$FAILS" >&2
  exit 2
fi
exit 0
