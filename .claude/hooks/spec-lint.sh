#!/usr/bin/env bash
# spec-lint.sh — 결정론 스펙 검사기 (호출형 — 이벤트 훅 아님: /spec · done-check · CI가 호출)
# 사용: spec-lint.sh <specs/NNN-slug> | --all     실패 = exit 2 + 항목 목록
set -uo pipefail

WORDS=.claude/hooks/spec-lint-words.txt
TOTAL_FAIL=0

lint_one() {
  local dir=${1%/}
  local spec="$dir/spec.md"
  local errs=()

  if [ ! -f "$spec" ]; then
    echo "spec-lint FAIL: $spec 없음"
    return 1
  fi

  # ⑤ frontmatter 필수 필드 (참조 문서 파일 규격 골격)
  # issue: 필드는 신규 스펙 필수 기재 권장이나 미강제 — 부재 = null(터미널 직행/레거시, CLAUDE.md [ASSUMED])
  local fm
  fm=$(awk '/^---$/{n++; next} n==1{print} n>=2{exit}' "$spec")
  local f
  for f in id title status owner approved_by approved_at approved_sha; do
    printf '%s\n' "$fm" | grep -qE "^${f}:" || errs+=("frontmatter 필수 필드 누락: $f")
  done

  # ① 모든 R#가 EARS 6형식 정규식에 부합
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    printf '%s' "$line" | grep -qE '^R[0-9]+ \((Ubiquitous|Event|State|Optional|Unwanted|Invariant)\):' \
      || errs+=("R# 형식 위반(EARS 6형식): ${line:0:60}")
  done < <(grep -E '^R[0-9]+' "$spec" 2>/dev/null || true)

  # ② 모호어 미사용
  if [ -f "$WORDS" ]; then
    local w
    while IFS= read -r w; do
      [ -z "$w" ] && continue
      grep -E "(^|[[:space:][:punct:]])${w}([[:space:][:punct:]]|$)" "$spec" 2>/dev/null | grep -qv '^#' \
        && errs+=("모호어 사용 금지: '$w' — 측정 가능한 표현으로")
    done < "$WORDS"
  fi

  # ③ 모든 R# ↔ 최소 1개 S# (covers 역참조)
  local covered rids r
  rids=$(grep -oE '^R[0-9]+' "$spec" 2>/dev/null | sort -u || true)
  covered=$(grep -oE 'covers:[^)]*' "$spec" 2>/dev/null | grep -oE 'R[0-9]+' | sort -u || true)
  for r in $rids; do
    printf '%s\n' "$covered" | grep -qx "$r" || errs+=("$r 를 covers 하는 S# 없음")
  done

  # ④ S#별 acceptance 골격 파일 존재
  local id s n
  id=$(printf '%s\n' "$fm" | grep -E '^id:' | head -1 | sed 's/^id:[[:space:]]*//' | tr -d '"')
  while IFS= read -r s; do
    [ -z "$s" ] && continue
    n=${s#S}
    ls acceptance/"$id"*/S"$n".* >/dev/null 2>&1 \
      || errs+=("$s 인수 테스트 골격 없음: acceptance/${id}*/S${n}.*")
  done < <(grep -oE '^S[0-9]+' "$spec" 2>/dev/null | sort -u || true)

  # ⑥ spec 본문에 API 패턴 감지 시 '## 계약' 섹션 필수
  if grep -E '^(R|S)[0-9]+' "$spec" 2>/dev/null | grep -qE '(/api/|(GET|POST|PUT|PATCH|DELETE)[[:space:]]+/)'; then
    grep -q '^## 계약' "$spec" \
      || errs+=("API 엔드포인트 감지 — '## 계약' 섹션 필수(OpenAPI 조각 또는 스키마 diff)")
  fi

  if [ "${#errs[@]}" -gt 0 ]; then
    echo "spec-lint FAIL: $dir"
    printf '  - %s\n' "${errs[@]}"
    return 1
  fi
  echo "spec-lint PASS: $dir"
  return 0
}

if [ "${1:-}" = "--all" ]; then
  FOUND=0
  for d in specs/*/; do
    case "$d" in specs/_inbox/) continue ;; esac
    [ -f "${d}spec.md" ] || continue
    FOUND=1
    lint_one "$d" || TOTAL_FAIL=1
  done
  [ "$FOUND" -eq 0 ] && echo "spec-lint: 검사할 스펙 없음 — 통과"
elif [ -n "${1:-}" ]; then
  lint_one "$1" || TOTAL_FAIL=1
else
  echo "사용법: spec-lint.sh <specs/NNN-slug | --all>" >&2
  exit 2
fi

[ "$TOTAL_FAIL" -eq 0 ] || exit 2
exit 0
