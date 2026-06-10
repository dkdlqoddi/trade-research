// 유니버스 전체 분석 집계 — 종목 단위 실패 흡수(R4), 동시 6개 제한
import { rsi14, trailingDrawdown } from './indicators';
import { reboundStats, PARAMS } from './rebound';
import { getDailyCloses, getUniverse } from './marketdata';
import type { UniverseEntry } from './universe';

export type TickerStats = UniverseEntry & {
  lastClose: number | null;
  drawdown: number | null;
  rsi14: number | null;
  episodes: number;
  rebounds: number;
  reboundRate: number | null;
  avgReboundPct: number | null;
  inDecline: boolean;
  error: string | null;
};

const CONCURRENCY = 6;

async function analyzeOne(u: UniverseEntry): Promise<TickerStats> {
  try {
    const closes = await getDailyCloses(u.ticker);
    const dd = trailingDrawdown(closes, PARAMS.HIGH_WINDOW);
    const stats = reboundStats(closes);
    return {
      ...u,
      lastClose: closes[closes.length - 1] ?? null,
      drawdown: dd,
      rsi14: rsi14(closes, PARAMS.RSI_PERIOD),
      ...stats,
      inDecline: dd !== null && dd <= PARAMS.ENTRY_DD,
      error: null,
    };
  } catch (e) {
    return {
      ...u,
      lastClose: null,
      drawdown: null,
      rsi14: null,
      episodes: 0,
      rebounds: 0,
      reboundRate: null,
      avgReboundPct: null,
      inDecline: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function analyzeUniverse(): Promise<TickerStats[]> {
  const universe = await getUniverse();
  const out: TickerStats[] = [];
  for (let i = 0; i < universe.length; i += CONCURRENCY) {
    const chunk = universe.slice(i, i + CONCURRENCY);
    out.push(...(await Promise.all(chunk.map(analyzeOne))));
  }
  return out;
}

// 하락 구간 정렬: 반등 성공률 desc(null 마지막) → 표본수 desc → 티커
export function sortByReboundRate(a: TickerStats, b: TickerStats): number {
  if (a.reboundRate === null && b.reboundRate === null) return a.ticker.localeCompare(b.ticker);
  if (a.reboundRate === null) return 1;
  if (b.reboundRate === null) return -1;
  if (b.reboundRate !== a.reboundRate) return b.reboundRate - a.reboundRate;
  if (b.episodes !== a.episodes) return b.episodes - a.episodes;
  return a.ticker.localeCompare(b.ticker);
}
