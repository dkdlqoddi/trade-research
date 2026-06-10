// 시세 어댑터 — DATA_SOURCE=fixture면 번들 픽스처(R7), 아니면 Yahoo Finance v8 chart([ASSUMED] 1)
import { loadUniverse, type UniverseEntry } from './universe';
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
      indicators?: {
        adjclose?: Array<{ adjclose?: Array<number | null> }>;
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
  };
};

// 일봉 adjusted close (과거→현재). 실패는 throw — 호출부가 종목 단위로 흡수(R4).
export async function getDailyCloses(ticker: string): Promise<number[]> {
  if (isFixtureMode()) {
    const s = (fixtures.series as Record<string, number[]>)[ticker];
    if (!s) throw new Error('픽스처에 시세 없음');
    return s;
  }

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
  const raw =
    result?.indicators?.adjclose?.[0]?.adjclose ?? result?.indicators?.quote?.[0]?.close ?? [];
  const closes = raw.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (closes.length < MIN_POINTS) throw new Error(`데이터 부족(${closes.length}일)`);
  return closes;
}
