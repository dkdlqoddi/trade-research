# Verification — 001 (rev2)

> 솔로 폴백 한계 고지: 작성자=검증자라 블라인드 분리가 불완전하다. 예측 절은 spec만 근거로 RED 단계 기대치를 기록한 것이며, 팀 모드 복귀 시 spec-verifier 분리가 원칙이다.

## 예측 (구현 미열람 · spec만 근거)

- R1: 유니버스는 data/stock-universe.md에서만 읽힌다 — md 수정만으로 종목 반영
- R2: 루트 접속 시 유니버스 전 종목 통계 표 렌더
- R3: drawdown ≤ −10% 종목은 "지금 하락 중" 구간에 성공률 내림차순
- R4: 일부 조회 실패 시 그 행만 실패 표시, 나머지 정상 — 원천 장애 시 기존 SQLite 캐시로 응답
- R5: 성공률 ∈ {null} ∪ [0,1], RSI ∈ [0,100] — 임의 입력 속성 테스트
- R6: 면책·변동성 잠식 경고 상시 노출
- R7: DATA_SOURCE=fixture에서 네트워크 0회 동작
- R8: 모든 시세가 SQLite(prices/fetch_log)에 저장되고 통계는 DB 시계열로 계산
- R9: 수집 24시간 이내 종목은 원천 API 호출 0회(fetch_log 신선도 판정)
- R10: 유니버스 = 주식 200 + ETF 100(레버리지 포함)
- R11: 요약 카드(유니버스·하락 중·반등 성공률·조회 실패) + 수집 시각 노출

## 실측

- R1: PASS — universe.test.ts(파싱·배율 비고 판별·헤더 배제). 카운트 검사 주식 200·ETF 100
- R2: PASS — 라이브(next dev, Yahoo): 298/300 조회 성공, 전 종목 표 렌더
- R3: PASS — 라이브 하락 구간 86종목 내림차순: CME 100%(3/3 표본부족) → GEV 94%(15/16) → SOXS 91% → ANET 90% → MU 84%. S2 통과(FIXDN 100%)
- R4: PASS — 라이브 실패 2건(FI·MMC HTTP 404) 행 격리 표시·나머지 정상. S3 통과. 캐시 폴백은 marketdata 경로 + db.test.ts
- R5: PASS — fast-check 속성 2건 + PARAMS 계약 테스트 (32/32)
- R6: PASS — S1 두 문구 단언 + 다크 테마 axe serious 0
- R7: PASS — 픽스처로 acceptance 6/6(9.9s), 빌드 프리렌더 성공
- R8: PASS — 라이브 후 data/market.db: prices 149,000행 / 298 티커 / fetch_log error 2건 기록. 픽스처는 :memory: 동일 경로(S4)
- R9: PASS — db.test.ts isFresh(24h 경계·오류 시 재시도·메타 없음) 4건 + marketdata 신선 캐시 우선 경로. ISR 2차 응답 1.1s
- R10: PASS — 섹션 카운트 기계 검사 {주식 상위 200: 200, ETF 상위 100: 100}, 중복 0
- R11: PASS — S5 카드 4종 단언 + S4 수집 칩("수집 2026-06-10 06:52 · SQLite")

게이트: tsc ✓ · eslint ✓ · vitest 32/32 ✓ · spec-lint PASS ✓ · build ✓(First Load ~102kB 유지, 클라이언트 JS 증가 0) · acceptance 6/6 ✓

## 판정

| R# | 예측↔실측 일치 | 최종 |
|---|---|---|
| R1 | 일치 | PASS |
| R2 | 일치 | PASS |
| R3 | 일치 | PASS |
| R4 | 일치 | PASS |
| R5 | 일치 | PASS |
| R6 | 일치 | PASS |
| R7 | 일치 | PASS |
| R8 | 일치 | PASS |
| R9 | 일치 | PASS |
| R10 | 일치 | PASS |
| R11 | 일치 | PASS |

## e2e 증거

| S# | 결과 | 증거 |
|---|---|---|
| S1 | PASS | 표·면책·경고 + 다크 테마 axe serious 0 (rev1에서 contrast 2.84 적발 이력 → rev2 팔레트 AA 설계) |
| S2 | PASS | FIXDN이 decline-section에 100% 표기 |
| S3 | PASS | FIXBAD 조회 실패 행 + FIXUP 정상 행 동시 렌더 |
| S4 | PASS | meta-fetched 칩에 ISO 날짜 — DB 경유 검증은 db.test.ts 8건 |
| S5 | PASS | summary-cards에 유니버스·지금 하락 중·반등 성공률·조회 실패 카드 |
| 000/S1 | PASS | 스모크 회귀 없음 |

## 검역 제외 목록

없음 — @quarantine 0건.
