import { afterEach, describe, expect, it } from 'vitest';
import { createStore, isFresh, type Store } from './db';

let store: Store;
afterEach(() => store?.close());

describe('createStore (R8)', () => {
  it('upsert는 (ticker, d) 기준으로 멱등이다 — 같은 날 재수집 시 갱신', () => {
    store = createStore(':memory:');
    store.upsertPrices('AAPL', [{ d: '2026-06-01', close: 100, volume: 10 }]);
    store.upsertPrices('AAPL', [{ d: '2026-06-01', close: 101, volume: 11 }]);
    expect(store.getCloses('AAPL')).toEqual([101]);
    expect(store.getSeries('AAPL').volumes).toEqual([11]);
  });

  it('getCloses는 삽입 순서와 무관하게 날짜 오름차순', () => {
    store = createStore(':memory:');
    store.upsertPrices('T', [
      { d: '2026-06-03', close: 3, volume: 30 },
      { d: '2026-06-01', close: 1, volume: 10 },
      { d: '2026-06-02', close: 2, volume: 20 },
    ]);
    expect(store.getCloses('T')).toEqual([1, 2, 3]);
    expect(store.getSeries('T')).toMatchObject({
      dates: ['2026-06-01', '2026-06-02', '2026-06-03'],
      closes: [1, 2, 3],
      volumes: [10, 20, 30],
    });
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

// ── 002 확장 ──

describe('스키마 v2 마이그레이션 ([ASSUMED 3])', () => {
  it('구버전(v1, volume 없음) 파일 DB를 드롭·재생성한다', async () => {
    const { mkdtempSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const path = await import('node:path');
    const Database = (await import('better-sqlite3')).default;

    const p = path.join(mkdtempSync(path.join(tmpdir(), 'mig-')), 'old.db');
    const old = new Database(p);
    old.exec(
      'CREATE TABLE prices (ticker TEXT, d TEXT, close REAL, PRIMARY KEY(ticker,d)); PRAGMA user_version=1;',
    );
    old.prepare('INSERT INTO prices VALUES (?,?,?)').run('OLD', '2026-01-01', 1);
    old.close();

    store = createStore(p);
    expect(store.getCloses('OLD')).toEqual([]); // 구데이터 드롭
    store.upsertPrices('NEW', [{ d: '2026-06-01', close: 2, volume: 5 }]); // v2 스키마 동작
    expect(store.getSeries('NEW').volumes).toEqual([5]);
  });
});

describe('스냅샷 (R4·R5)', () => {
  it('직전 스냅샷이 없으면 null', () => {
    store = createStore(':memory:');
    expect(store.prevSnapshot('2026-06-10')).toBeNull();
  });

  it('가장 가까운 과거 스냅샷의 in_decline 맵을 준다', () => {
    store = createStore(':memory:');
    store.saveSnapshot('2026-06-08', [
      { ticker: 'A', in_decline: 1, drawdown: -0.2, rebound_rate: 0.5 },
    ]);
    store.saveSnapshot('2026-06-09', [
      { ticker: 'A', in_decline: 0, drawdown: -0.05, rebound_rate: 0.5 },
      { ticker: 'B', in_decline: 1, drawdown: -0.12, rebound_rate: null },
    ]);
    const prev = store.prevSnapshot('2026-06-10')!;
    expect(prev.snapDate).toBe('2026-06-09');
    expect(prev.inDecline.get('A')).toBe(false);
    expect(prev.inDecline.get('B')).toBe(true);
  });

  it('같은 날 재저장은 멱등(갱신)', () => {
    store = createStore(':memory:');
    store.saveSnapshot('2026-06-09', [
      { ticker: 'A', in_decline: 0, drawdown: 0, rebound_rate: null },
    ]);
    store.saveSnapshot('2026-06-09', [
      { ticker: 'A', in_decline: 1, drawdown: -0.11, rebound_rate: 1 },
    ]);
    expect(store.prevSnapshot('2026-06-10')!.inDecline.get('A')).toBe(true);
  });
});

describe('오류 이력 (R13)', () => {
  it('오류만 최신순으로 준다', () => {
    store = createStore(':memory:');
    store.logFetch('OK', 100, null, '2026-06-10T01:00:00Z');
    store.logFetch('BAD1', 0, 'HTTP 404', '2026-06-10T02:00:00Z');
    store.logFetch('BAD2', 0, 'HTTP 429', '2026-06-10T03:00:00Z');
    const errs = store.getErrors();
    expect(errs.map((e) => e.ticker)).toEqual(['BAD2', 'BAD1']);
  });

  it('이력은 append-only — 이후 수집이 성공해도 과거 오류가 남는다(리뷰 지적 반영)', () => {
    store = createStore(':memory:');
    store.logFetch('T', 0, 'HTTP 500', '2026-06-09T01:00:00Z');
    store.logFetch('T', 500, null, '2026-06-10T01:00:00Z'); // 성공 — fetch_log는 갱신되지만
    expect(store.getMeta('T')!.error).toBeNull();
    expect(store.getErrors().map((e) => e.ticker)).toEqual(['T']); // error_log에는 남는다
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
