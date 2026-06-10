---
bolt: 002
owner: "@dkdlqoddi"
touches:
  - "src/lib/screener/**"
  - "src/app/**"
  - "acceptance/002-screener-extensions/**"
  - "scripts/**"
  - "vercel.json"
  - ".env.example"
---

- [x] T1 (R14,R1) 윌슨 하한·회복 소요일·MAE 테스트 — 경계·속성. 테스트 먼저(RED)
- [x] T2 (R3) 보조지표(sma 이격·%B·거래량 급증) 테스트. 테스트 먼저(RED)
- [x] T3 (R5,R13) db v2 테스트 — volume 왕복·스키마 마이그레이션·스냅샷 저장/직전 조회·오류 목록. 테스트 먼저(RED)
- [x] T4 (R11) 프리셋 파라미터화 테스트 — extractEpisodes/reboundStats(params). 테스트 먼저(RED)
- [x] T5 구현 — indicators·rebound·db v2·marketdata(volume·force)·screener(윌슨 정렬·신규 진입·레짐 소스·closes60)
- [x] T6 픽스처 v2 — volume 시계열 + SPY 추가 + 어제 스냅샷 시드, 계약 테스트 갱신
- [x] T7 (R6) /api/collect 라우트 + vercel.json cron + .env.example CRON_SECRET
- [x] T8 (R1,R2,R4,R7,R9,R13) 메인 페이지 — 신규 진입 구간·레짐 칩·윌슨 표기·스파크라인·품질 패널·프리셋 nav
- [x] T9 (R8,R3) 상세 페이지 /t/[ticker] — SVG 차트+마커·사례 표·보조지표 카드
- [x] T10 (R10) ExplorerTable 클라이언트 — 검색·카테고리·정렬·관심목록(localStorage)
- [x] T11 (R12) /methodology 페이지
- [x] T12 acceptance S1·S6~S11 통과 + 게이트 전체 + verification.md
