#!/usr/bin/env bash
# changelog.sh — CHANGELOG.html 결정론 생성기 (R4.1, 이벤트 훅 아님 — /ship·main 직접 커밋·수동 호출)
# 사용: changelog.sh [--pending "커밋/PR 제목"]
#   --pending = 이번에 main에 쌓일 예정인 엔트리를 맨 위에 선반영(같은 커밋에 포함시키기 위함)
# 단일 진실은 git log(main 계보) — 같은 이력이면 같은 HTML. 손편집 금지(재생성이 덮는다).
set -uo pipefail

OUT=CHANGELOG.html
PENDING=""
[ "${1:-}" = "--pending" ] && PENDING="${2:-}"

# main 계보 선택:
#  - main 위에서 실행(직접 커밋 예외 경로) → 로컬 main이 진실(미푸시 커밋 포함)
#  - 브랜치 위에서 실행(/ship 표준 경로) → origin/main(출하된 이력) + --pending이 내 몫
CUR=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)
if [ "$CUR" = "main" ]; then
  REF=main
elif git rev-parse --verify -q origin/main >/dev/null 2>&1; then
  REF=origin/main
elif git rev-parse --verify -q main >/dev/null 2>&1; then
  REF=main
else
  REF=HEAD
fi

esc() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

badge() { # $1 = subject → 타입 클래스명
  case "$1" in
    feat*) echo feat ;;
    fix*) echo fix ;;
    spec*) echo spec ;;
    plan*) echo plan ;;
    docs*) echo docs ;;
    test*) echo test ;;
    refactor*) echo refactor ;;
    handoff*) echo handoff ;;
    chore*) echo chore ;;
    *) echo etc ;;
  esac
}

row() { # $1=date $2=subject $3=body $4=hash(없으면 pending)
  local d=$1 s=$2 b=$3 h=$4 t es eb
  t=$(badge "$s")
  es=$(printf '%s' "$s" | esc)
  printf '    <li class="entry">\n'
  printf '      <span class="date">%s</span>\n' "$d"
  printf '      <span class="badge %s">%s</span>\n' "$t" "$t"
  printf '      <span class="subject">%s</span>\n' "$es"
  if [ -n "$h" ]; then
    printf '      <code class="hash">%s</code>\n' "${h:0:7}"
  else
    printf '      <code class="hash pending">pending</code>\n'
  fi
  if [ -n "$b" ]; then
    eb=$(printf '%s' "$b" | esc)
    printf '      <details><summary>상세</summary><pre>%s</pre></details>\n' "$eb"
  fi
  printf '    </li>\n'
}

ENTRIES=""
if [ -n "$PENDING" ]; then
  ENTRIES+=$(row "$(date +%F)" "$PENDING" "" "")
  ENTRIES+=$'\n'
fi

# git log를 레코드(\x1e)·필드(\x1f) 구분자로 안전 파싱
while IFS=$'\x1f' read -r -d $'\x1e' H D S B; do
  H=${H#$'\n'} # 레코드 사이 개행 제거
  [ -z "$H" ] && continue
  B=$(printf '%s' "$B" | sed -e 's/[[:space:]]*$//' -e '/^$/d' | sed -e 's/^Co-Authored-By:.*$//' -e '/^$/d')
  ENTRIES+=$(row "$D" "$S" "$B" "$H")
  ENTRIES+=$'\n'
done < <(git log "$REF" --pretty=format:'%H%x1f%as%x1f%s%x1f%b%x1e' 2>/dev/null)

TOTAL=$(git rev-list --count "$REF" 2>/dev/null || echo 0)
[ -n "$PENDING" ] && TOTAL=$((TOTAL + 1))
LAST=$(git log -1 --format=%as "$REF" 2>/dev/null || echo '-')
[ -n "$PENDING" ] && LAST=$(date +%F)

cat > "$OUT" <<HTML
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>trade-research — CHANGELOG</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
         max-width: 880px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #8884; padding-bottom: .5rem; }
  .meta { color: #888; font-size: .85rem; margin-bottom: 1.5rem; }
  ul.log { list-style: none; padding: 0; }
  li.entry { display: flex; flex-wrap: wrap; gap: .6rem; align-items: baseline;
             padding: .55rem .6rem; border-bottom: 1px solid #8883; }
  li.entry:nth-child(odd) { background: #8881; }
  .date { color: #888; font-size: .85rem; font-variant-numeric: tabular-nums; min-width: 6.2rem; }
  .badge { font-size: .72rem; font-weight: 700; padding: .1rem .45rem; border-radius: .6rem;
           text-transform: uppercase; letter-spacing: .02em; }
  .badge.feat { background: #2e7d3222; color: #2e7d32; }
  .badge.fix { background: #c6282822; color: #c62828; }
  .badge.spec { background: #1565c022; color: #1565c0; }
  .badge.plan { background: #6a1b9a22; color: #6a1b9a; }
  .badge.docs { background: #00838f22; color: #00838f; }
  .badge.test { background: #ef6c0022; color: #ef6c00; }
  .badge.refactor { background: #4e342e22; color: #795548; }
  .badge.handoff { background: #37474f22; color: #546e7a; }
  .badge.chore, .badge.etc { background: #61616122; color: #757575; }
  .subject { flex: 1 1 24rem; }
  code.hash { color: #888; font-size: .8rem; }
  code.hash.pending { color: #ef6c00; }
  details { flex-basis: 100%; margin: 0 0 0 6.8rem; }
  summary { cursor: pointer; color: #888; font-size: .82rem; }
  pre { white-space: pre-wrap; font-size: .82rem; background: #8881; padding: .6rem; border-radius: .4rem; }
  footer { margin-top: 2rem; color: #888; font-size: .78rem; border-top: 1px solid #8883; padding-top: .8rem; }
</style>
</head>
<body>
<h1>trade-research — CHANGELOG</h1>
<p class="meta">main 커밋 ${TOTAL}건 · 최종 갱신 ${LAST} · 기준 계보 ${REF}</p>
<ul class="log">
${ENTRIES}</ul>
<footer>생성기: <code>.claude/hooks/changelog.sh</code> — 이 파일은 git log의 파생물이다. 손편집 금지(다음 재생성이 덮는다). 병합 충돌·엔트리 누락은 재생성으로 해소.</footer>
</body>
</html>
HTML

echo "changelog.sh: $OUT 재생성 완료 (${TOTAL}건, 기준 $REF)"
