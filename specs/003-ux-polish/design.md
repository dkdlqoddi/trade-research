# Design — 003 UX 개선 일괄

## 결정

1. **메인 표 전부 클라이언트화** — DeclineTable(정렬·aria-sort·배지)·WatchSection(localStorage)·ExplorerTable(기존). 행 데이터는 페이지에서 1회 직렬화해 공유(`ScreenRow`).
2. **URL 동기화 = history.replaceState** — Next 라우터를 타면 searchParams 변경마다 서버 재분석이 돈다. 브라우저 히스토리만 조작([ASSUMED 2]).
3. **방문 추적** — `lastVisit`(localStorage, ISO). 하락 시작일은 스냅샷 이력에서 산출: `db.declineStartDates()` = 티커별 현재 연속 하락 구간의 시작 snap_date. `declineStart > lastVisit` → "방문 후 진입" 배지.
4. **차트 강화** — PriceChart를 컴포넌트로 추출(서버 순수). 날짜 축 라벨(text.xaxis), 거래량 서브차트(rect.vol, 하단 18%), 마커 `<title>`(JS 없는 네이티브 툴팁). 기간은 쿼리 `?range=6m|1y|2y`로 서버 슬라이스 — 마커는 보이는 구간 기준 재추출, 사례 표는 전체 시계열 유지.
5. **이웃 탐색** — 상세 페이지가 기본 프리셋 하락 정렬에서 이전/다음 산출(SQLite 캐시 위 순수 계산이라 비용 미미).
6. **테마/밀도** — `html[data-theme]`·`[data-density]` + CSS 변수 오버라이드. 초기 적용은 마운트 시(짧은 다크 플래시 허용, [ASSUMED 3]).
7. **CSV** — UTF-8 BOM + 현재 필터·정렬 뷰만. Blob 다운로드(서버 왕복 없음).
8. **모바일** — 719px 이하에서 `.responsive` 표를 카드형(display:block + td::before data-label)으로. CSS만.

## Decision Log

| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-06-10 | URL 동기화에 라우터 미사용 | searchParams 변경 = RSC 재실행 = 300종목 재분석 — 입력마다 서버 타면 UX 역행 |
| 2026-06-10 | 하락 시작일을 스냅샷에서 도출(새 테이블 없음) | snapshots가 이미 일별 in_decline 보유 — 파생 계산으로 충분 |
| 2026-06-10 | 테마 초기화 인라인 스크립트 회피 | CSP·복잡도 대비 다크 플래시 1프레임이 싸다 |
