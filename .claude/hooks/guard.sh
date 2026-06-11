#!/usr/bin/env bash
# guard.sh — PreToolUse 게이트 (파괴 명령·보호 경로·페이즈 규율·스펙 동결·조정 잠금)
# 차단 = exit 2 + stderr 사유(Claude에 피드백). jq 부재 시 python3 폴백.
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

deny() {
  printf 'guard: %s\n' "$1" >&2
  exit 2
}

spec_status() { # $1 = spec.md → frontmatter status 값
  awk '/^---$/{n++; next} n==1 && /^status:/{print $2; exit}' "$1" 2>/dev/null | tr -d '"'
}

TOOL=$(jget .tool_name)
PHASE=$(cat .claude/state/phase 2>/dev/null || printf 'IDLE')
ACTIVE=$(cat .claude/state/active-bolt 2>/dev/null || true)

# ──────────────────────────── Bash ────────────────────────────
if [ "$TOOL" = "Bash" ]; then
  CMD=$(jget .tool_input.command)
  [ -z "$CMD" ] && exit 0

  # 파괴 명령
  printf '%s' "$CMD" | grep -qE 'rm[[:space:]]+-[a-zA-Z]*[rf][a-zA-Z]*[[:space:]]+("/"|/([[:space:]]|$)|/\*|~/?([[:space:]]|$)|\$HOME)' \
    && deny "파괴 명령: rm -rf 루트/홈 차단"
  printf '%s' "$CMD" | grep -qE 'git[[:space:]]+push[[:space:]]+.*(--force|[[:space:]]-f([[:space:]]|$))' \
    && deny "파괴 명령: git push --force 차단 (이력 보호)"
  printf '%s' "$CMD" | grep -qiE '(^|[^a-z_])(drop[[:space:]]+(table|database|schema)|truncate([[:space:]]+table)?)([^a-z_]|$)' \
    && deny "파괴 명령: DROP/TRUNCATE 차단 — 비가역 DB 작업은 에스컬레이션 ②"

  # 시크릿 (.env.example만 허용)
  STRIPPED=${CMD//.env.example/}
  printf '%s' "$STRIPPED" | grep -q '\.env' \
    && deny "시크릿: .env 접근 차단 — 변수 이름은 .env.example에만"

  # GitHub 스코프 (constitution §12) — 이슈 등록·수정·close는 사람 전용, Claude는 view/list/comment만
  printf '%s' "$CMD" | grep -qE '(^|[[:space:];|&])gh[[:space:]]+issue[[:space:]]+(create|edit|close|delete|reopen|transfer|pin|unpin|lock|unlock)([[:space:]]|$)' \
    && deny "이슈 등록·수정·close는 사람 전용 (constitution §12) — close는 머지의 Closes #N이 한다"
  printf '%s' "$CMD" | grep -qE '(^|[[:space:];|&])gh[[:space:]]+(secret|api)([[:space:]]|$)' \
    && deny "스코프 외: gh secret/api 금지 (constitution §12)"
  printf '%s' "$CMD" | grep -qE '(^|[[:space:];|&])gh[[:space:]]+repo[[:space:]]+delete' \
    && deny "파괴 명령: gh repo delete 차단"

  # 보호 경로 셸 우회 쓰기 — AMEND 외 차단 (.claude/state/, settings.local.json 예외)
  if [ "$PHASE" != "AMEND" ]; then
    if printf '%s' "$CMD" | grep -qE '(>>?|sed[[:space:]]+-i|tee[[:space:]]|mv[[:space:]]|cp[[:space:]]|rm[[:space:]]).*(\.claude/|specs/constitution\.md|docs/adr/)'; then
      printf '%s' "$CMD" | grep -qE '\.claude/(state/|settings\.local\.json)' \
        || deny "보호 경로(.claude/** · constitution · ADR)는 AMEND 페이즈에서만 — 사람이 터미널에서 'AMEND 승인' 선언 후"
    fi
  fi

  # GREEN 중 셸 우회 테스트 수정
  if [ "$PHASE" = "GREEN" ]; then
    printf '%s' "$CMD" | grep -qE '(>>?|sed[[:space:]]+-i|tee[[:space:]]).*(\.test\.|\.spec\.|acceptance/)' \
      && deny "GREEN: 테스트·acceptance 수정 금지(TDD) — 구현으로 통과시켜라"
  fi

  # spec.md 셸 in-place 수정 금지 (동결 검사는 Edit 경로에서만 판정 가능)
  printf '%s' "$CMD" | grep -qE '(>>?|sed[[:space:]]+-i|tee[[:space:]]).*specs/[^[:space:]]*/spec\.md' \
    && deny "spec.md는 Edit 도구로만 수정 (스펙 동결 검사 경유)"

  exit 0
fi

# ─────────────────── Edit / Write / MultiEdit ───────────────────
FILE=$(jget .tool_input.file_path)
[ -z "$FILE" ] && exit 0
CWD=$(jget .cwd)
[ -z "$CWD" ] && CWD=$PWD
REL=${FILE#"$CWD"/}

# 시크릿 쓰기 차단
case "$REL" in
  .env.example) : ;;
  .env|.env.*) deny "시크릿: .env* 쓰기 차단 — 변수 이름만 .env.example에" ;;
esac

# 보호 경로 — AMEND에서만 (state·개인 local.json 예외)
if [ "$PHASE" != "AMEND" ]; then
  case "$REL" in
    .claude/state/*|.claude/settings.local.json) : ;;
    .claude/*|specs/constitution.md|docs/adr/*)
      deny "보호 경로 — AMEND 페이즈에서만 수정 (진입: 사람이 'AMEND 승인' 명시, 머지: CODEOWNERS 리뷰)" ;;
  esac
fi

# 스펙 동결: status != draft 인 spec.md는 스탬프 필드 외 수정 불가
case "$REL" in
  specs/*/spec.md)
    if [ -f "$REL" ]; then
      ST=$(spec_status "$REL")
      if [ -n "$ST" ] && [ "$ST" != "draft" ]; then
        [ "$TOOL" = "Write" ] && deny "스펙 동결(status=$ST): 전체 재작성 불가 — 스탬프는 Edit로, 본문 개정은 /spec --revise"
        [ "$TOOL" = "MultiEdit" ] && deny "스펙 동결(status=$ST): MultiEdit 불가 — 스탬프 필드는 단건 Edit로"
        OLD=$(jget .tool_input.old_string)
        NEW=$(jget .tool_input.new_string)
        BAD=$(printf '%s\n%s\n' "$OLD" "$NEW" | grep -vE '^[[:space:]]*$' | grep -cvE '^(status|approved_by|approved_at|approved_sha|owner):' || true)
        [ "${BAD:-0}" -gt 0 ] \
          && deny "스펙 동결(status=$ST): frontmatter 스탬프 필드(status/approved_*/owner)만 수정 가능 — 개정은 /spec --revise"
      fi
    fi
    ;;
esac

# G1 전 구현 차단: active 스펙이 draft인데 phase가 RED 이후면 src 수정 불가
if [ -n "$ACTIVE" ]; then
  SPEC=$(ls -d specs/"$ACTIVE"-*/spec.md 2>/dev/null | head -1)
  if [ -n "$SPEC" ] && [ "$(spec_status "$SPEC")" = "draft" ]; then
    case "$PHASE" in
      RED|GREEN|REFACTOR|VERIFY|REVIEW)
        case "$REL" in
          src/*) deny "G1 미승인(status=draft) 상태에서 src 수정 불가 — /bolt가 승인 확인·스탬프 후 진행" ;;
        esac
        ;;
    esac
  fi
fi

# GREEN: 테스트·acceptance 수정 차단
if [ "$PHASE" = "GREEN" ]; then
  case "$REL" in
    *.test.*|*.spec.*|acceptance/*)
      deny "GREEN: 테스트·acceptance 수정 금지(TDD) — 테스트 변경은 RED로 복귀 후" ;;
  esac
fi

# 조정 잠금: 다른 볼트의 touches 글롭과 교집합이면 차단
for LOCK in .claude/state/locks/*.paths; do
  [ -e "$LOCK" ] || continue
  N=$(basename "$LOCK" .paths)
  [ -n "$ACTIVE" ] && [ "$N" = "$ACTIVE" ] && continue
  while IFS= read -r G; do
    [ -z "$G" ] && continue
    # shellcheck disable=SC2254
    case "$REL" in
      $G) deny "조정 잠금: $REL 은 볼트 $N 의 점유 범위(touches) — 30분 대기 또는 에스컬레이션 ⑥" ;;
    esac
  done < "$LOCK"
done

exit 0
