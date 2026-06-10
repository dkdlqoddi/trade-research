// 시세 어댑터 — 모든 시세는 SQLite를 경유한다(R8). 흐름:
//   fetch_log 신선(24h, R9) → DB에서 응답(원천 호출 0)
//   오래됨 → 원천(yahoo 또는 픽스처) 수집 → upsert+log → DB에서 응답
//   원천 실패 → error 로깅 후 기존 캐시가 충분하면 캐시로 응답(R4 강화), 없으면 throw
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
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
  };
};

const epochToDate = (sec: number) => new Date(sec * 1000).toISOString().slice(0, 10);

// 픽스처 시계열 → 결정론 날짜 부여(2024-01-01부터 1일 간격 — d는 정렬 키일 뿐)
function fixtureRows(ticker: string): PriceRow[] {
  const s = (fixtures.series as Record<string, number[]>)[ticker];
  if (!s) throw new Error('픽스처에 시세 없음');
  const base = Date.UTC(2024, 0, 1);
  return s.map((close, i) => ({
    d: new Date(base + i * 86_400_000).toISOString().slice(0, 10),
    close,
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
  const raw =
    result?.indicators?.adjclose?.[0]?.adjclose ?? result?.indicators?.quote?.[0]?.close ?? [];
  const rows: PriceRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (typeof c === 'number' && Number.isFinite(c) && typeof ts[i] === 'number') {
      rows.push({ d: epochToDate(ts[i]), close: c });
    }
  }
  if (rows.length < MIN_POINTS) throw new Error(`데이터 부족(${rows.length}일)`);
  return rows;
}

export async function getDailyCloses(ticker: string): Promise<number[]> {
  const store = getStore();

  if (isFresh(store.getMeta(ticker))) {
    const cached = store.getCloses(ticker);
    if (cached.length >= MIN_POINTS) return cached; // R9: 원천 호출 없음
  }

  try {
    const rows = await fetchRemoteRows(ticker);
    store.upsertPrices(ticker, rows);
    store.logFetch(ticker, rows.length, null);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    store.logFetch(ticker, 0, msg);
    const cached = store.getCloses(ticker);
    if (cached.length >= MIN_POINTS) return cached; // 원천 죽어도 캐시로 생존(R4)
    throw e;
  }

  return store.getCloses(ticker);
}

// 페이지 요약 카드용 — 마지막 성공 수집 시각(R11)
export function lastFetchedAt(): string | null {
  return getStore().latestFetchedAt();
}
