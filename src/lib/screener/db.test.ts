import { afterEach, describe, expect, it } from 'vitest';
import { createStore, isFresh, type Store } from './db';

let store: Store;
afterEach(() => store?.close());

describe('createStore (R8)', () => {
  it('upsert는 (ticker, d) 기준으로 멱등이다 — 같은 날 재수집 시 갱신', () => {
    store = createStore(':memory:');
    store.upsertPrices('AAPL', [{ d: '2026-06-01', close: 100 }]);
    store.upsertPrices('AAPL', [{ d: '2026-06-01', close: 101 }]);
    expect(store.getCloses('AAPL')).toEqual([101]);
  });

  it('getCloses는 삽입 순서와 무관하게 날짜 오름차순', () => {
    store = createStore(':memory:');
    store.upsertPrices('T', [
      { d: '2026-06-03', close: 3 },
      { d: '2026-06-01', close: 1 },
      { d: '2026-06-02', close: 2 },
    ]);
    expect(store.getCloses('T')).toEqual([1, 2, 3]);
  });

  it('fetch_log 왕복 — points·error 기록', () => {
    store = createStore(':memory:');
    store.logFetch('T', 500, null);
    expect(store.getMeta('T')).toMatchObject({ ticker: 'T', points: 500, error: null });
    store.logFetch('T', 0, 'HTTP 429');
    expect(store.getMeta('T')!.error).toBe('HTTP 429');
  });

  it('latestFetchedAt — 전 종목 중 가장 최근 수집 시각', () => {
    store = createStore(':memory:');
    expect(store.latestFetchedAt()).toBeNull();
    store.logFetch('A', 1, null, '2026-06-09T00:00:00Z');
    store.logFetch('B', 1, null, '2026-06-10T00:00:00Z');
    expect(store.latestFetchedAt()).toBe('2026-06-10T00:00:00Z');
  });
});

describe('isFresh (R9 — 24시간 TTL)', () => {
  const now = new Date('2026-06-10T12:00:00Z');
  const meta = (fetchedAt: string, error: string | null = null) => ({
    ticker: 'T',
    fetched_at: fetchedAt,
    points: 500,
    error,
  });

  it('24시간 이내·무오류면 신선', () => {
    expect(isFresh(meta('2026-06-10T00:00:00Z'), now)).toBe(true);
  });

  it('24시간 경과면 오래됨', () => {
    expect(isFresh(meta('2026-06-09T11:00:00Z'), now)).toBe(false);
  });

  it('직전 수집이 오류였으면 TTL 내라도 재시도 대상(신선 아님)', () => {
    expect(isFresh(meta('2026-06-10T11:00:00Z', 'HTTP 500'), now)).toBe(false);
  });

  it('메타 없음 = 신선 아님', () => {
    expect(isFresh(null, now)).toBe(false);
  });
});
