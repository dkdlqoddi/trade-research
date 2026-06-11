# Verification — 003

> 솔로 폴백 한계 고지: 작성자=검증자. 예측은 spec 기준 RED 단계 기대치.

## 예측 (구현 미열람 · spec만 근거)

- R1: 라우트 loading으로 첫 분석 동안 스켈레톤 — 본문 로드 후 정상 표
- R2: 720px 미만에서 표 셀이 카드형(block)으로
- R3: 통계 용어 헤더에 ⓘ → /methodology 앵커
- R4: 검색·정렬 상태가 ?q=·?sort=로 유지, 새로고침 견딤
- R5: lastVisit(localStorage) 이전이 하락 시작일보다 빠르면 "방문 후 진입" 배지
- R6: 관심목록 비어 있지 않으면 상단 관심 구간
- R7: 하락 표 머리글 클릭 정렬
- R8: range 쿼리로 차트 기간 전환 + 날짜 축·거래량·마커 title
- R9: 상세에 하락 정렬 기준 이전/다음 + 비교 링크
- R10: /compare?a=&b= 나란히 통계·차트
- R11: 신규 진입 구간에 직전 스냅샷 날짜 상시 표기
- R12: 갱신 버튼 → /api/collect → reload
- R13: skip-link + aria-sort
- R14: CSV(BOM) 다운로드 — 현재 필터 뷰만
- R15: html[data-theme/density] 토글 + localStorage 지속

## 실측

- R1: PASS — app/loading.tsx·t/[ticker]/loading.tsx, S1 본문 로드
- R2: PASS — S1b: 480px에서 td computed display=block
- R3: PASS — S2: a.info href=/methodology#… + 용어 절(#wilson·#mae·#pctb·#volsurge) 신설
- R4: PASS — S3: ?q=FIXUP 반영·reload 후 검색창·필터 유지(replaceState — 서버 재분석 없음)
- R5: PASS — db.declineStartDates 단위 2건(연속 구간 시작·재진입·이탈 제외) + S4 배지(2020 방문 시드)
- R6: PASS — S4: watch-section 가시·FIXDN 행
- R7: PASS — S2: RSI th aria-sort none→descending→ascending
- R8: PASS — S5: text.xaxis·rect.vol·circle title("진입 …")·range-nav 2Y 전환
- R9/R10: PASS — S6: neighbor-nav(하락 1/1 + 비교 링크)·/compare 두 카드+차트
- R11: PASS — S7: "직전 스냅샷 YYYY-MM-DD 대비" 정규식 매칭
- R12: PASS — S7: 갱신 버튼 가시(호출 경로는 HeaderControls.refresh)
- R13: PASS — S1 skip-link href=#main + R7의 aria-sort
- R14: PASS — S7: download 이벤트 .csv 파일명
- R15: PASS — S7: 토글 → html[data-theme=light], reload 후 유지

게이트: tsc ✓ · eslint ✓ · vitest **57/57** ✓ · spec-lint --all PASS ✓ · 픽스처 build ✓ · acceptance **22/22**(23.4s — 000·001·002 회귀 포함) ✓ · semgrep/gitleaks 클린

수정 이력: S10(002)이 error_log append-only 설계와 충돌(strict mode 6건) → first() 존재 검증으로 정정. PriceChart <title> 배열 경고 → 템플릿 문자열.

## 판정

| R# | 예측↔실측 일치 | 최종 |
|---|---|---|
| R1~R15 | 전 항목 일치 | PASS |

## e2e 증거

S1·S1b·S2·S3·S4·S5·S6·S6b·S7 전부 PASS — 22/22 (위 실측에 1:1 매핑).

## 검역 제외 목록

없음 — @quarantine 0건.
