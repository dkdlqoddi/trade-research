// SQLite 영속 계층 (R8·R9) — better-sqlite3 동기 API.
// 역할: 일봉 시세의 수집 캐시 + 수집 감사 레코드. 통계 계산에는 관여하지 않는다(순수 함수가 담당).
import Database from 'better-sqlite3';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prices (
  ticker TEXT NOT NULL,
  d      TEXT NOT NULL, -- YYYY-MM-DD
  close  REAL NOT NULL,
  PRIMARY KEY (ticker, d)
);
CREATE TABLE IF NOT EXISTS fetch_log (
  ticker     TEXT PRIMARY KEY,
  fetched_at TEXT NOT NULL, -- ISO 8601
  points     INTEGER NOT NULL,
  error      TEXT
);
`;

export type PriceRow = { d: string; close: number };
export type FetchMeta = {
  ticker: string;
  fetched_at: string;
  points: number;
  error: string | null;
};

export const TTL_HOURS = 24; // [ASSUMED 7] 일봉은 하루 1회 수집이면 충분

// 신선 = 무오류 + TTL 이내. 오류 수집은 TTL 내라도 재시도 대상.
export function isFresh(meta: FetchMeta | null, now: Date = new Date()): boolean {
  if (!meta || meta.error) return false;
  const age = now.getTime() - new Date(meta.fetched_at).getTime();
  return age >= 0 && age < TTL_HOURS * 3600_000;
}

export type Store = ReturnType<typeof createStore>;

export function createStore(dbPath: string) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);

  const upsert = db.prepare(
    'INSERT INTO prices (ticker, d, close) VALUES (?, ?, ?) ' +
      'ON CONFLICT(ticker, d) DO UPDATE SET close = excluded.close',
  );
  const selectCloses = db.prepare('SELECT close FROM prices WHERE ticker = ? ORDER BY d ASC');
  const upsertLog = db.prepare(
    'INSERT INTO fetch_log (ticker, fetched_at, points, error) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(ticker) DO UPDATE SET fetched_at = excluded.fetched_at, points = excluded.points, error = excluded.error',
  );
  const selectMeta = db.prepare('SELECT * FROM fetch_log WHERE ticker = ?');
  const selectLatest = db.prepare(
    'SELECT MAX(fetched_at) AS latest FROM fetch_log WHERE error IS NULL',
  );

  const upsertMany = db.transaction((ticker: string, rows: PriceRow[]) => {
    for (const r of rows) upsert.run(ticker, r.d, r.close);
  });

  return {
    upsertPrices(ticker: string, rows: PriceRow[]): void {
      upsertMany(ticker, rows);
    },
    getCloses(ticker: string): number[] {
      return (selectCloses.all(ticker) as Array<{ close: number }>).map((r) => r.close);
    },
    logFetch(ticker: string, points: number, error: string | null, at?: string): void {
      upsertLog.run(ticker, at ?? new Date().toISOString(), points, error);
    },
    getMeta(ticker: string): FetchMeta | null {
      return (selectMeta.get(ticker) as FetchMeta | undefined) ?? null;
    },
    latestFetchedAt(): string | null {
      return (selectLatest.get() as { latest: string | null }).latest;
    },
    close(): void {
      db.close();
    },
  };
}

// 프로세스 싱글톤 — 픽스처 모드는 :memory:(R7·S4), 아니면 data/market.db(gitignore, 런타임 산출물)
let singleton: Store | null = null;

export function getStore(): Store {
  if (singleton) return singleton;
  const p =
    process.env.DATA_SOURCE === 'fixture'
      ? ':memory:'
      : (process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'market.db'));
  singleton = createStore(p);
  return singleton;
}
