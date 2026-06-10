# Design — 001 미국 주식 반등 스크리너

## 결정

1. **시세 출처 = Yahoo Finance v8 chart** (`query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=2y&interval=1d`, adjusted close). 무키·무계정. 비공식 → 종목 단위 실패 허용(R4) + 1시간 ISR로 호출 최소화. 대안(stooq CSV)은 BRK-B 류 티커 표기가 달라 보류.
2. **통계는 순수 함수로 분리** — `src/lib/screener/`의 indicators(RSI·drawdown)·rebound(사례 추출·성공률)는 IO 없는 순수 모듈. TDD 안쪽 루프 대상.
3. **픽스처 모드** — `DATA_SOURCE=fixture`면 유니버스·시세 모두 번들 JSON(`fixtures.json`)로 대체(R7). 인수 테스트·CI의 결정론 확보. 픽스처는 생성기(`scripts/gen-fixtures.mjs`)로 재현 가능.
4. **페이지 = 루트(/) 서버 컴포넌트** — `revalidate = 3600`(ISR). 클라이언트 JS 추가 없음(표는 정적 렌더) → 성능 예산 영향 최소.
5. **렌더 구간 2개**: "지금 하락 중"(반등 성공률 내림차순, 표본<5 라벨) / "나머지 전 종목". 실패 종목은 같은 표에서 "조회 실패" 행으로 구분(R4).

## 데이터 모델

```ts
type UniverseEntry = { ticker: string; name: string; category: string; leveraged: boolean; note: string };
type DailySeries = { ticker: string; closes: number[] }; // adjusted close, 과거→현재
type TickerStats = UniverseEntry & {
  lastClose: number | null;
  drawdown: number | null;     // 60일 고점 대비, 예: -0.12
  rsi14: number | null;
  episodes: number;            // 과거 진입 사례 수(완결분만)
  rebounds: number;            // 성공 수
  reboundRate: number | null;  // rebounds/episodes, episodes=0이면 null
  avgReboundPct: number | null;// 사례별 20일 내 최대 회복폭 평균
  inDecline: boolean;          // drawdown ≤ -10%
  error: string | null;        // 조회 실패 사유
};
```

## 파라미터 (PARAMS — 페이지에 명시, 변경은 스펙 개정)

`HIGH_WINDOW=60` · `ENTRY_DD=-0.10` · `HORIZON=20` · `TARGET=0.05` · `RSI_PERIOD=14`

## 알고리즘

- drawdown(i) = close[i] / max(close[i-59..i]) − 1 (창이 모자라면 가용 구간)
- 진입일: drawdown이 −10%를 하향 돌파(전일 > −10% && 당일 ≤ −10%)
- 사례: 진입일 i 기준 close[i+1..i+20]의 max → 회복폭. HORIZON 미충족 꼬리 사례(미완결)는 표본에서 제외
- RSI(14): Wilder smoothing, avgLoss=0 → 100, avgGain=0 → 0
- 정렬: inDecline 구간 reboundRate desc(null 마지막), 동률은 표본수 desc

## Decision Log

| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-06-10 | 솔로 폴백으로 진행(브랜치 보호·팀원 부재) — 산출물은 정식, 게이트는 터미널 | CLAUDE.md mode 절·constitution §13 예외 |
| 2026-06-10 | 예측 모델 대신 백테스트 빈도 통계 | 결정론·검증 가능성(R5 속성 테스트), 과대 해석 방지(R6 면책) |
| 2026-06-10 | e2e는 픽스처 모드 고정, 실데이터는 수동 확인 | 외부 API flaky가 required 게이트를 오염시키면 안 됨(constitution §8) |
