---
bolt: 001
owner: "@dkdlqoddi"
touches:
  - "src/lib/screener/**"
  - "src/app/**"
  - "data/**"
  - "acceptance/001-rebound-screener/**"
  - "scripts/**"
---

- [x] T1 (R5) indicators 단위·속성 테스트 — RSI 경계(전상승=100·전하락≈0·정의역 [0,100] 속성), drawdown 산식. 테스트 먼저(RED)
- [x] T2 (R5) rebound 사례 추출 테스트 — 진입 돌파·성공/실패 판정·미완결 꼬리 제외·성공률 정의역 속성. 테스트 먼저(RED)
- [x] T3 (R1) universe 파서 테스트 — md 표 파싱(티커·이름·카테고리·레버리지 플래그). 테스트 먼저(RED)
- [x] T4 (R5,R1) indicators·rebound·universe 구현으로 T1~T3 GREEN
- [x] T5 (R7,R4) marketdata — yahoo fetch(동시 6개 제한·실패 허용) + fixture 분기 + 픽스처 생성기
- [x] T6 (R2,R3,R6) 루트 페이지 서버 컴포넌트 — 두 구간 표·면책·레버리지 경고·PARAMS 표기
- [x] T7 (S1,S2,S3) acceptance 픽스처 모드 통과
- [x] T8 검증 — 전 게이트(tsc·eslint·vitest·spec-lint·build) + verification.md 작성
