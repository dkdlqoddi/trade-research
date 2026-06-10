# Verification — 001

> 솔로 폴백 한계 고지: 작성자=검증자라 블라인드 분리가 불완전하다. 예측 절은 spec만 근거로 RED 단계 기대치를 기록한 것이며, 팀 모드 복귀 시 spec-verifier 분리가 원칙이다.

## 예측 (구현 미열람 · spec만 근거)

- R1: 유니버스는 data/stock-universe.md에서만 읽힌다 — 파서 테스트가 md 표를 종목 배열로 변환, md에 종목 추가 시 코드 수정 불요
- R2: 루트 접속 시 53종목(현 유니버스) 전부의 통계 표(티커·이름·카테고리·낙폭·RSI·표본·성공률·평균 회복폭) 렌더
- R3: drawdown ≤ −10% 종목은 "지금 하락 중" 구간에 성공률 내림차순 — 정렬 위반 0
- R4: 일부 티커 조회 실패 시 그 행만 실패 표시, 나머지 정상 — 픽스처 FIXBAD로 재현 가능
- R5: 성공률은 항상 null 또는 [0,1], RSI는 [0,100] — 임의 입력 속성 테스트 통과
- R6: 면책 문구·변동성 잠식 경고가 페이지에 상시 노출
- R7: DATA_SOURCE=fixture에서 네트워크 0회로 전 시나리오 동작

## 실측

- R1: PASS — universe.test.ts 3건(파싱·레버리지 플래그·헤더 배제). 라이브 페이지 "유니버스 53종목" 표기
- R2: PASS — 라이브 실측(next dev, Yahoo 실데이터): 53/53 조회 성공·실패 0, 표 행 55(데이터 53+헤더 2)
- R3: PASS — 라이브 하락 구간 22종목, 상위: SOXS 91%(10/11) → AVGO 83%(15/18) → SOXL 83%(19/23) → TSLL 79% — 내림차순 확인. S2 인수 통과(FIXDN 100%)
- R4: PASS — S3 인수 통과(FIXBAD "조회 실패" 행 + 나머지 정상 렌더)
- R5: PASS — fast-check 속성 테스트 2건(indicators.test.ts·rebound.test.ts) + PARAMS 계약 테스트
- R6: PASS — S1 인수에서 두 문구 가시성 단언 통과
- R7: PASS — DATA_SOURCE=fixture로 acceptance 4/4(8.8s→5.2s), 빌드 프리렌더 성공

게이트: tsc ✓ · eslint ✓ · vitest 24/24 ✓ · spec-lint PASS ✓ · next build ✓(First Load 102kB, 클라이언트 JS 증가 0)

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

## e2e 증거

| S# | 결과 | 증거 |
|---|---|---|
| S1 | PASS | acceptance/001-rebound-screener/S1 — 표·면책·경고 + axe serious 0 (1차 color-contrast 2.84:1 적발 → #999→#6b6b6b 보정 후 통과) |
| S2 | PASS | FIXDN이 decline-section에 100% 표기 |
| S3 | PASS | FIXBAD "조회 실패" 행 + FIXUP 정상 행 동시 렌더 |
| 000/S1 | PASS | 기존 스모크 회귀 없음 |

라이브 모드 보조 실측: Yahoo v8 chart 응답 정상(AAPL 5d 샘플), 53종목 전수 fetch 성공, /tmp/live-page.html 스냅샷에서 구간·정렬·배지 확인.

## 검역 제외 목록

없음 — @quarantine 0건.
