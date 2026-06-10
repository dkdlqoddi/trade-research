// 시세 어댑터 — 모든 시세는 SQLite를 경유한다(R8). 흐름:
//   fetch_log 신선(24h, R9) → DB에서 응답(원천 호출 0)   ※ force는 TTL 무시(002 R6)
//   오래됨 → 원천(yahoo 또는 픽스처) 수집 → upsert+log → DB에서 응답
//   원천 실패 → error 로깅 후 기존 캐시가 충분하면 캐시로 응답(R4), 없으면 throw
import { loadUniverse, type UniverseEntry } from './universe';
import { getStore, isFresh, type PriceRow } from './db';
import fixtures from './fixtures.json';

const MIN_POINTS = 30;

export function isFixtureMode(): boolean {
  return process.env.DATA_SOURCE === 'fixture';
}

export async function getUniverse(): Promise<UniverseEntry[]> {
  if (isFixtureMode()) return fixtures.universe as UniverseEntry[];
  return loadUniverse();
}

type YahooChart = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        adjclose?: Array<{ adjclose?: Array<number | null> }>;
        quote?: Array<{ close?: Array<number | null>; volume?: Array<number | null> }>;
      };
    }>;
  };
};

const epochToDate = (sec: number) => new Date(sec * 1000).toISOString().slice(0, 10);

// 픽스처 시계열 → 결정론 날짜(2024-01-01부터 1일 간격)·결정론 거래량
function fixtureRows(ticker: string): PriceRow[] {
  const s = (fixtures.series as Record<string, number[]>)[ticker];
  if (!s) throw new Error('픽스처에 시세 없음');
  const base = Date.UTC(2024, 0, 1);
  return s.map((close, i) => ({
    d: new Date(base + i * 86_400_000).toISOString().slice(0, 10),
    close,
    volume: 1000 + ((i * 37) % 300),
  }));
}

async function fetchRemoteRows(ticker: string): Promise<PriceRow[]> {
  if (isFixtureMode()) return fixtureRows(ticker);

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?range=2y&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (trade-research screener)' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as YahooChart;
  const result = json.chart?.result?.[0];
  const ts = result?.timestamp ?? [];
  const closes =
    result?.indicators?.adjclose?.[0]?.adjclose ?? result?.indicators?.quote?.[0]?.close ?? [];
  const volumes = result?.indicators?.quote?.[0]?.volume ?? [];
  const rows: PriceRow[] = [];
  for (let i = 0; i < closes.length; i++) {
    const c = closes[i];
    if (typeof c === 'number' && Number.isFinite(c) && typeof ts[i] === 'number') {
      const v = volumes[i];
      rows.push({
        d: epochToDate(ts[i]),
        close: c,
        volume: typeof v === 'number' && Number.isFinite(v) ? v : 0,
      });
    }
  }
  if (rows.length < MIN_POINTS) throw new Error(`데이터 부족(${rows.length}일)`);
  return rows;
}

// 수집 보장 — 신선하면 no-op(R9), force면 무조건 재수집(R6)
export async function ensureCollected(ticker: string, opts?: { force?: boolean }): Promise<void> {
  const store = getStore();
  if (!opts?.force && isFresh(store.getMeta(ticker))) {
    if (store.getCloses(ticker).length >= MIN_POINTS) return;
  }
  try {
    const rows = await fetchRemoteRows(ticker);
    store.upsertPrices(ticker, rows);
    store.logFetch(ticker, rows.length, null);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    store.logFetch(ticker, 0, msg);
    if (store.getCloses(ticker).length >= MIN_POINTS) return; // 원천 죽어도 캐시로 생존(R4)
    throw e;
  }
}

export async function getDailyCloses(ticker: string): Promise<number[]> {
  await ensureCollected(ticker);
  return getStore().getCloses(ticker);
}

// 페이지 요약 카드용 — 마지막 성공 수집 시각(R11)
export function lastFetchedAt(): string | null {
  return getStore().latestFetchedAt();
}
