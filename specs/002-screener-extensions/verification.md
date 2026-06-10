# Verification — 002

> 솔로 폴백 한계 고지: 작성자=검증자. 예측은 spec 기준 RED 단계 기대치. 추가로 독립 검증 에이전트 2기(diff 리뷰·전 파일 일관성)를 투입했다 — 결과는 하단.

## 예측 (구현 미열람 · spec만 근거)

- R1: 하락 행에 윌슨 하한·표본 병기 — 2/2 성공은 하한 34%
- R2: 하락 구간 정렬 = 윌슨 하한 desc — 소표본 100%가 대표본 94% 아래로
- R3: MA50/200 이격·%B·거래량 급증이 상세 페이지에 표시
- R4: 직전 스냅샷 대비 신규 진입 구간 — 첫 가동(스냅샷 없음)은 빈 구간
- R5: 기본 프리셋 분석 시 일일 스냅샷 저장
- R6: /api/collect 계약 — 200 JSON, collected+failed=유니버스, CRON_SECRET 시 401
- R7: SPY 하락 여부로 레짐 배지
- R8: 상세 — 2년 차트+진입 마커+사례 표
- R9: 전 행 60일 스파크라인
- R10: 검색·카테고리·정렬·관심(localStorage, 새로고침 유지)
- R11: 프리셋 전환 시 재계산(−7%/10일/+3% 반영)
- R12: 방법론 페이지 — 생존 편향·변동성 잠식 명시
- R13: 품질 패널에 오류 이력
- R14: 0 ≤ 윌슨 하한 ≤ 성공률 (속성)

## 실측

- R1: PASS — wilsonLow(2,2)=0.3424 단위 + S1 "하한 34%" 단언
- R2: PASS — sortByWilson + S1. 라이브 메인에 "하한" 표기 확인
- R3: PASS — 지표 단위 7건 + S7 카드 단언
- R4: PASS — 스냅샷 단위 3건 + S6(픽스처 어제 시드 → FIXDN 신규). 라이브 첫 가동 신규 0(예측 일치)
- R5: PASS — 라이브 snapshots: 2026-06-10 × 298종목 저장
- R6: PASS — S11(200, collected+failed=5, failed≥1) + force 경로
- R7: PASS — S6 칩 + 라이브 "시장 정상 (SPY …)"
- R8: PASS — S7 차트·circle 마커·사례 2행 + 라이브 /t/AVGO 차트 렌더
- R9: PASS — S1 svg.spark + 라이브 스파크 470개
- R10: PASS — S8: FIXUP 검색 필터·FIXLEV 소거·★ 토글 reload 후 aria-pressed=true
- R11: PASS — S9: ?preset=aggressive URL·7% 표기·프리셋 단위 테스트(−7% 진입 차이)
- R12: PASS — S10: /methodology 생존 편향·변동성 잠식 단언
- R13: PASS — S10 품질 패널 FIXBAD + db.getErrors 단위
- R14: PASS — fast-check 속성(n≤500 전수성 무작위)

게이트: tsc ✓ · eslint ✓ · vitest **54/54** ✓ · spec-lint --all PASS ✓ · 픽스처 build ✓(/t/[ticker] 동적, First Load 106kB) · acceptance **13/13**(14.1s) ✓
스키마 v2 마이그레이션 실측: 구 DB(user_version<2) → 드롭·재생성 → user_version=2, prices 149,000행 전부 volume>0.

## 판정

| R# | 예측↔실측 일치 | 최종 |
|---|---|---|
| R1~R14 | 전 항목 일치 | PASS |

(개별 행 생략 없음 — 위 실측 절에 R#별 근거 1:1 기재)

## e2e 증거

| S# | 결과 | 증거 |
|---|---|---|
| S1 | PASS | 윌슨 하한 34%·스파크라인 |
| S6 | PASS | 신규 진입 구간 FIXDN + 레짐 칩 |
| S7 | PASS | 차트 마커·사례 2행·보조지표 카드 |
| S8 | PASS | 검색 필터·관심 토글 localStorage 지속 |
| S9 | PASS | 공격 프리셋 URL·파라미터 반영 |
| S10 | PASS | 방법론 한계 서술 + 품질 패널 FIXBAD |
| S11 | PASS | /api/collect 200 계약 |
| 001 S1~S5·000 | PASS | 회귀 없음 (13/13) |

## 독립 에이전트 검증

**에이전트 A — diff 리뷰**(🟡5 🔵2 ❓1 → 전부 처리):
1. ✅ 수정: fetch_log 티커당 1행이라 성공 시 과거 오류 소실 = R13 "이력" 위반 → append-only error_log(스키마 v3) + 회귀 테스트
2. ✅ 수정: ISR 렌더 중 스냅샷 쓰기 — 읽기전용 FS에서 페이지 사망 위험 → try/catch + 권위 저장을 /api/collect로 이동
3. ✅ 수정: 픽스처 yesterday를 Date.now() 기준 산출 — 자정 경계 비결정성 → today() 문자열 기준 산출
4. ✅ 수정: CRON_SECRET 비교 `!==` 타이밍 누설 → timingSafeEqual
5. ✅ 기록: cron 쿼리(force=1) 스트립 위험 — TTL(24h) ≤ cron 주기라 force 없이도 수집됨(Decision Log)
6. ✅ 주석: S11은 CRON_SECRET 미설정 환경 전제 명시
- 스펙 정합 판정: 윌슨 z=1.96·TTL 24h·프리셋 값·정렬·신규 진입 시맨틱 전부 스펙 일치, 테스트 약화 0건

**에이전트 B — 전 파일 일관성**: 5/5 카테고리 PASS, 구조 결함 0 (md 교차참조 / 스펙 규율·touches 커버리지 / 스택 배터리(훅·에이전트·워크플로·토큰) / 위생(gitignore·검역 제외) / CHANGELOG 제도)

수정 반영 후 재검증: tsc ✓ · eslint ✓ · vitest **55/55** ✓ · acceptance **13/13** ✓

## 검역 제외 목록

없음 — @quarantine 0건.
