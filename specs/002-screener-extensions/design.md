# Design — 002 스크리너 확장 1차

## 결정

1. **순수 함수 우선 유지** — 윌슨·회복 소요일·MAE·보조지표 전부 IO 없는 모듈(indicators/rebound)에 추가. `extractEpisodes`·`reboundStats`는 파라미터 객체를 받도록 일반화(기본값 = 기존 PARAMS → 호환).
2. **정렬 = 윌슨 하한** — 표본 3건 100%가 표본 16건 94% 위에 오는 왜곡 제거(R2, 001 정렬 대체).
3. **스키마 v2** — prices에 volume 추가. 캐시는 파생 데이터: 마이그레이션 = `PRAGMA user_version` 검사 후 드롭·재생성(외부 영속 요구 없음).
4. **스냅샷** — `snapshots(snap_date, ticker, in_decline, drawdown, rebound_rate, PK(snap_date,ticker))`. 기본 프리셋 분석시에만 저장. 신규 진입 = 직전 스냅샷(in_decline=0) ∧ 오늘 하락. 픽스처는 어제 스냅샷 시드(S6 결정론).
5. **프리셋** — PRESETS{conservative, default, aggressive}, 쿼리 `?preset=` 서버 재계산(클라이언트 JS 불요). 스냅샷·신규 진입은 기본 프리셋 전용.
6. **첫 클라이언트 컴포넌트** = ExplorerTable(검색·카테고리·정렬·관심목록). 행 데이터는 서버 직렬화 props. 관심목록 localStorage("watchlist"). 하락·신규 구간은 서버 렌더 유지(결정론·e2e 안정).
7. **스파크라인·차트 = 서버 SVG** — 의존성 0. 상세 차트는 polyline + 진입 마커 circle(성공 green/실패 red).
8. **수집 엔드포인트** `/api/collect` — force=1로 TTL 무시. CRON_SECRET 있으면 Bearer 검사(시크릿은 환경변수, 커밋 금지). vercel.json cron 평일 21:30 UTC.
9. **품질 패널** — fetch_log의 error 행 노출(details/summary, 메인 페이지 하단).
10. **레짐** — 별도 수집 없이 유니버스 내 SPY의 stats 재사용. 픽스처에 SPY(상승 시계열) 추가.

## 데이터 모델 (증분)

```ts
type ScreenParams = { HIGH_WINDOW; ENTRY_DD; HORIZON; TARGET; RSI_PERIOD; MIN_SAMPLES };
type Episode += { mae: number; daysToTarget: number | null };
type ReboundStats += { wilsonLow: number | null; avgRecoveryDays: number | null; avgMae: number | null };
type TickerStats += { wilsonLow; avgRecoveryDays; avgMae; maDist50; maDist200; pctB; volSurge; isNewEntry; closes60: number[] };
-- SQLite v2
prices(ticker, d, close, volume, PK(ticker,d))
snapshots(snap_date, ticker, in_decline, drawdown, rebound_rate, PK(snap_date,ticker))
```

## Decision Log

| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-06-10 | 알림·펀더멘털·점수화·공개 API 제외 | 시크릿 부재(에스컬레이션 ③)·의존 확대·면책 재설계 — [ASSUMED 1] |
| 2026-06-10 | 정렬을 윌슨 하한으로 교체 | 소표본 100%의 과대 노출 방지 — 통계적 보수성 |
| 2026-06-10 | 캐시 DB 마이그레이션 = 드롭 재생성 | prices는 24h 내 재수집 가능한 파생 데이터 — 마이그레이션 코드 부채 회피 |
| 2026-06-10 | (리뷰 반영) 오류 이력 = append-only error_log 테이블(v3) | fetch_log는 티커당 1행이라 성공 시 과거 오류 소실 — R13 "이력" 위반이었음 |
| 2026-06-10 | (리뷰 반영) 렌더 중 스냅샷 쓰기 try/catch + 권위 저장은 /api/collect | 읽기전용 FS 배포에서 쓰기 실패가 페이지를 죽이면 안 됨 |
| 2026-06-10 | (리뷰 반영) cron 쿼리(force=1) 스트립돼도 안전 | TTL(24h) ≤ cron 주기(24h+)라 force 없이도 stale 판정 → 수집됨 |
| 2026-06-10 | (리뷰 반영) 시크릿 비교 timingSafeEqual | === 비교는 타이밍 누설 |
