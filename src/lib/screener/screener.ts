// 유니버스 전체 분석 집계 — 종목 단위 실패 흡수(R4), 동시 6개 제한
import {
  rsi14,
  trailingDrawdown,
  maDistance,
  bollingerPctB,
  volumeSurge,
} from './indicators';
import {
  reboundStats,
  extractEpisodes,
  PRESETS,
  type PresetKey,
  type ScreenParams,
  type Episode,
} from './rebound';
import { ensureCollected, getUniverse, isFixtureMode } from './marketdata';
import { getStore } from './db';
import type { UniverseEntry } from './universe';

export type TickerStats = UniverseEntry & {
  lastClose: number | null;
  drawdown: number | null;
  rsi14: number | null;
  episodes: number;
  rebounds: number;
  reboundRate: number | null;
  avgReboundPct: number | null;
  wilsonLow: number | null;
  avgRecoveryDays: number | null;
  avgMae: number | null;
  maDist50: number | null;
  maDist200: number | null;
  pctB: number | null;
  volSurge: number | null;
  inDecline: boolean;
  isNewEntry: boolean; // 직전 스냅샷 대비 신규 하락 진입(R4) — 기본 프리셋에서만 판정
  closes60: number[]; // 스파크라인용(R9)
  error: string | null;
};

const CONCURRENCY = 6;
const today = () => new Date().toISOString().slice(0, 10);

function emptyStats(u: UniverseEntry, error: string | null): TickerStats {
  return {
    ...u,
    lastClose: null,
    drawdown: null,
    rsi14: null,
    episodes: 0,
    rebounds: 0,
    reboundRate: null,
    avgReboundPct: null,
    wilsonLow: null,
    avgRecoveryDays: null,
    avgMae: null,
    maDist50: null,
    maDist200: null,
    pctB: null,
    volSurge: null,
    inDecline: false,
    isNewEntry: false,
    closes60: [],
    error,
  };
}

async function analyzeOne(u: UniverseEntry, p: ScreenParams): Promise<TickerStats> {
  try {
    await ensureCollected(u.ticker);
    const { closes, volumes } = getStore().getSeries(u.ticker);
    const dd = trailingDrawdown(closes, p.HIGH_WINDOW);
    return {
      ...u,
      lastClose: closes[closes.length - 1] ?? null,
      drawdown: dd,
      rsi14: rsi14(closes, p.RSI_PERIOD),
      ...reboundStats(closes, p),
      maDist50: maDistance(closes, 50),
      maDist200: maDistance(closes, 200),
      pctB: bollingerPctB(closes),
      volSurge: volumeSurge(volumes),
      inDecline: dd !== null && dd <= p.ENTRY_DD,
      isNewEntry: false, // 아래 스냅샷 단계에서 판정
      closes60: closes.slice(-60).map((c) => Math.round(c * 100) / 100),
      error: null,
    };
  } catch (e) {
    return emptyStats(u, e instanceof Error ? e.message : String(e));
  }
}

// 픽스처 결정론(S6): 어제 스냅샷을 "전부 하락 아님"으로 시드 → FIXDN이 오늘 신규 진입이 된다
function seedFixtureSnapshot(tickers: string[]): void {
  const store = getStore();
  const t = today();
  if (store.prevSnapshot(t)) return;
  // today() 문자열에서 직접 하루를 빼야 자정 경계에서 두 시계가 어긋나지 않는다(리뷰 지적)
  const yesterday = new Date(Date.parse(t) - 86_400_000).toISOString().slice(0, 10);
  store.saveSnapshot(
    yesterday,
    tickers.map((ticker) => ({ ticker, in_decline: 0 as const, drawdown: 0, rebound_rate: null })),
  );
}

export async function analyzeUniverse(preset: PresetKey = 'default'): Promise<TickerStats[]> {
  const p = PRESETS[preset].params;
  const universe = await getUniverse();

  if (isFixtureMode()) seedFixtureSnapshot(universe.map((u) => u.ticker));

  const out: TickerStats[] = [];
  for (let i = 0; i < universe.length; i += CONCURRENCY) {
    const chunk = universe.slice(i, i + CONCURRENCY);
    out.push(...(await Promise.all(chunk.map((u) => analyzeOne(u, p)))));
  }

  // 스냅샷·신규 진입은 기본 프리셋 기준(R5, design 결정 5).
  // 쓰기 실패(읽기전용 FS 배포)가 페이지 렌더를 죽이면 안 된다 — 권위 저장 경로는 /api/collect(cron).
  if (preset === 'default') {
    try {
      const store = getStore();
      const t = today();
      const prev = store.prevSnapshot(t);
      for (const s of out) {
        if (!s.error && s.inDecline && prev && prev.inDecline.get(s.ticker) === false) {
          s.isNewEntry = true;
        }
      }
      store.saveSnapshot(
        t,
        out
          .filter((s) => !s.error)
          .map((s) => ({
            ticker: s.ticker,
            in_decline: s.inDecline ? (1 as const) : (0 as const),
            drawdown: s.drawdown,
            rebound_rate: s.reboundRate,
          })),
      );
    } catch (e) {
      console.warn('snapshot 저장 실패 — 렌더는 계속(신규 진입 판정 비활성):', e);
    }
  }
  return out;
}

// 종목 상세(R8) — 차트·사례·보조지표
export type TickerDetail = {
  entry: UniverseEntry;
  dates: string[];
  closes: number[];
  episodes: Episode[];
  stats: TickerStats;
};

export async function analyzeTicker(
  ticker: string,
  preset: PresetKey = 'default',
): Promise<TickerDetail | null> {
  const universe = await getUniverse();
  const entry = universe.find((u) => u.ticker === ticker);
  if (!entry) return null;
  const p = PRESETS[preset].params;
  const stats = await analyzeOne(entry, p);
  if (stats.error) return { entry, dates: [], closes: [], episodes: [], stats };
  const { dates, closes } = getStore().getSeries(ticker);
  return { entry, dates, closes, episodes: extractEpisodes(closes, p), stats };
}

// 하락 구간 정렬: 윌슨 하한 desc(002 R2 — 소표본 과대 노출 방지) → 표본수 desc → 티커
export function sortByWilson(a: TickerStats, b: TickerStats): number {
  if (a.wilsonLow === null && b.wilsonLow === null) return a.ticker.localeCompare(b.ticker);
  if (a.wilsonLow === null) return 1;
  if (b.wilsonLow === null) return -1;
  if (b.wilsonLow !== a.wilsonLow) return b.wilsonLow - a.wilsonLow;
  if (b.episodes !== a.episodes) return b.episodes - a.episodes;
  return a.ticker.localeCompare(b.ticker);
}
