#!/usr/bin/env bash
# issue-lint.sh — 접수 형식 검사기 (호출형 — 이벤트 훅 아님: /triage와 /spec #N이 호출한다)
# 사용: issue-lint.sh <이슈번호>     실패 = exit 2 + 위반 항목 목록(이 목록이 그대로 반려 코멘트 본문)
# 검사(전부 기계 판정): ① 제목 접두 ② 폼 필수 섹션(### 헤더) ③ FEAT: Given/When/Then ≥1
#                       ④ 기대 결과의 모호어(spec-lint-words.txt 재사용) ⑤ BUG: 재현 절차 ≥2단계
set -uo pipefail

WORDS=.claude/hooks/spec-lint-words.txt
N="${1:-}"

if [ -z "$N" ]; then
  echo "사용법: issue-lint.sh <이슈번호>" >&2
  exit 2
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "issue-lint FAIL: gh CLI 없음 — 이슈를 읽을 수 없다" >&2
  exit 2
fi

TITLE=$(gh issue view "$N" --json title --jq .title 2>/dev/null) || {
  echo "issue-lint FAIL: 이슈 #$N 조회 실패 (gh issue view)" >&2
  exit 2
}
BODY=$(gh issue view "$N" --json body --jq .body 2>/dev/null) || BODY=""

errs=()

# ① 제목 접두 — [FEAT]/[BUG]/[CHORE]/[REFACTOR]/[SPIKE]/[SEC] 중 하나.
# [SEC]는 프라이빗 리포 전제로 폼 접수(가시성 = 팀 한정) — 단 실자격증명·시크릿·PoC는 이슈에도 금지.
KIND=""
case "$TITLE" in
  \[FEAT\]*) KIND=FEAT ;;
  \[BUG\]*) KIND=BUG ;;
  \[CHORE\]*) KIND=CHORE ;;
  \[REFACTOR\]*) KIND=CHORE ;;
  \[SPIKE\]*) KIND=SPIKE ;;
  \[SEC\]*) KIND=SEC ;;
  *) errs+=("제목 접두 위반: [FEAT]·[BUG]·[CHORE]·[REFACTOR]·[SPIKE]·[SEC] 중 하나로 시작해야 함 (현재: ${TITLE:0:40})") ;;
esac

# 본문 섹션 헤더 목록 (Issue Forms가 label을 '### 라벨'로 렌더)
has_section() { printf '%s\n' "$BODY" | grep -q "^### $1"; }

# $1 = 섹션 라벨 접두 → 그 섹션 본문 출력(다음 ### 전까지)
section_body() {
  printf '%s\n' "$BODY" | awk -v h="^### $1" '
    $0 ~ h {f=1; next}
    f && /^### / {exit}
    f {print}'
}

# ② 폼 필수 섹션
req=()
case "$KIND" in
  FEAT)  req=("배경/문제" "사용자 시나리오" "기대 결과" "제약/비기능" "영향 범위" "우선순위") ;;
  BUG)   req=("재현 절차" "기대 vs 실제" "환경/로그") ;;
  CHORE) req=("동기" "행동 불변 선언" "범위" "위험") ;;
  SPIKE) req=("답하려는 질문" "타임박스" "기대 산출물") ;;
  SEC)   req=("영향 범위" "재현 경로" "심각도" "노출 기간") ;;
esac
for s in ${req[@]+"${req[@]}"}; do
  has_section "$s" || errs+=("필수 섹션 누락: ### $s")
done

# ③ FEAT — 시나리오에 Given/When/Then 각 1회 이상
if [ "$KIND" = "FEAT" ]; then
  SCEN=$(section_body "사용자 시나리오")
  for kw in Given When Then; do
    printf '%s\n' "$SCEN" | grep -qi "$kw" \
      || errs+=("사용자 시나리오에 $kw 없음 — Given/When/Then ≥1 (그대로 EARS·acceptance로 변환 가능해야 함)")
  done
fi

# ④ 기대 결과가 검증 가능 문장 — 모호어 사전 재사용 (FEAT: 기대 결과 / SPIKE: 기대 산출물)
check_vague() { # $1 = 섹션 라벨
  local sec w
  sec=$(section_body "$1")
  [ -z "$sec" ] && return 0
  [ -f "$WORDS" ] || return 0
  while IFS= read -r w; do
    [ -z "$w" ] && continue
    printf '%s\n' "$sec" | grep -qE "(^|[[:space:][:punct:]])${w}([[:space:][:punct:]]|$)" \
      && errs+=("'$1'에 모호어 '$w' — 측정 가능한 표현으로(검증 가능해야 acceptance가 된다)")
  done < "$WORDS"
  return 0
}
[ "$KIND" = "FEAT" ] && check_vague "기대 결과"
[ "$KIND" = "SPIKE" ] && check_vague "기대 산출물"

# ⑤ BUG — 재현 절차 ≥2단계 (번호/불릿 줄 수)
if [ "$KIND" = "BUG" ]; then
  STEPS=$(section_body "재현 절차" | grep -cE '^[[:space:]]*([0-9]+[.)]|[-*])[[:space:]]' || true)
  [ "${STEPS:-0}" -ge 2 ] || errs+=("재현 절차가 ${STEPS:-0}단계 — 번호/불릿으로 2단계 이상 필요")
fi

if [ "${#errs[@]}" -gt 0 ]; then
  echo "issue-lint FAIL: #$N — 아래 항목을 수정 후 다시 검토 요청"
  printf -- '- [ ] %s\n' "${errs[@]}"
  exit 2
fi
echo "issue-lint PASS: #$N ($KIND) — /spec $N 진행 가능"
exit 0
