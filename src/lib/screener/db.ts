// SQLite 영속 계층 (R8·R9, 002에서 v2) — better-sqlite3 동기 API.
// 역할: 일봉 시세 수집 캐시 + 수집 감사 + 일일 스냅샷. 통계 계산에는 관여하지 않는다(순수 함수가 담당).
import Database from 'better-sqlite3';
import path from 'node:path';

// v3: error_log(append-only 오류 이력 — R13) 추가. v2: prices.volume, snapshots.
// 캐시는 파생 데이터 — 구버전은 드롭 후 재생성 (002 [ASSUMED 3])
const SCHEMA_VERSION = 3;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prices (
  ticker TEXT NOT NULL,
  d      TEXT NOT NULL, -- YYYY-MM-DD
  close  REAL NOT NULL,
  volume REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (ticker, d)
);
CREATE TABLE IF NOT EXISTS fetch_log (
  ticker     TEXT PRIMARY KEY,
  fetched_at TEXT NOT NULL, -- ISO 8601
  points     INTEGER NOT NULL,
  error      TEXT
);
CREATE TABLE IF NOT EXISTS snapshots (
  snap_date    TEXT NOT NULL, -- YYYY-MM-DD
  ticker       TEXT NOT NULL,
  in_decline   INTEGER NOT NULL,
  drawdown     REAL,
  rebound_rate REAL,
  PRIMARY KEY (snap_date, ticker)
);
CREATE TABLE IF NOT EXISTS error_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  at     TEXT NOT NULL, -- ISO 8601
  error  TEXT NOT NULL
);
`;

export type PriceRow = { d: string; close: number; volume: number };
export type FetchMeta = {
  ticker: string;
  fetched_at: string;
  points: number;
  error: string | null;
};
export type SnapshotRow = {
  ticker: string;
  in_decline: 0 | 1;
  drawdown: number | null;
  rebound_rate: number | null;
};
export type ErrorEntry = { id: number; ticker: string; at: string; error: string };

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

  const ver = db.pragma('user_version', { simple: true }) as number;
  if (ver < SCHEMA_VERSION) {
    db.exec(
      'DROP TABLE IF EXISTS prices; DROP TABLE IF EXISTS fetch_log; DROP TABLE IF EXISTS snapshots; DROP TABLE IF EXISTS error_log;',
    );
    db.exec(SCHEMA);
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  } else {
    db.exec(SCHEMA);
  }

  const upsert = db.prepare(
    'INSERT INTO prices (ticker, d, close, volume) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(ticker, d) DO UPDATE SET close = excluded.close, volume = excluded.volume',
  );
  const selectSeries = db.prepare(
    'SELECT d, close, volume FROM prices WHERE ticker = ? ORDER BY d ASC',
  );
  const upsertLog = db.prepare(
    'INSERT INTO fetch_log (ticker, fetched_at, points, error) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(ticker) DO UPDATE SET fetched_at = excluded.fetched_at, points = excluded.points, error = excluded.error',
  );
  const selectMeta = db.prepare('SELECT * FROM fetch_log WHERE ticker = ?');
  const selectLatest = db.prepare(
    'SELECT MAX(fetched_at) AS latest FROM fetch_log WHERE error IS NULL',
  );
  const insertError = db.prepare('INSERT INTO error_log (ticker, at, error) VALUES (?, ?, ?)');
  const selectErrors = db.prepare('SELECT * FROM error_log ORDER BY at DESC, id DESC LIMIT 50');
  const upsertSnap = db.prepare(
    'INSERT INTO snapshots (snap_date, ticker, in_decline, drawdown, rebound_rate) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(snap_date, ticker) DO UPDATE SET in_decline = excluded.in_decline, drawdown = excluded.drawdown, rebound_rate = excluded.rebound_rate',
  );
  const selectPrevDate = db.prepare(
    'SELECT MAX(snap_date) AS d FROM snapshots WHERE snap_date < ?',
  );
  const selectSnap = db.prepare('SELECT ticker, in_decline FROM snapshots WHERE snap_date = ?');

  const upsertMany = db.transaction((ticker: string, rows: PriceRow[]) => {
    for (const r of rows) upsert.run(ticker, r.d, r.close, r.volume);
  });
  const snapMany = db.transaction((date: string, rows: SnapshotRow[]) => {
    for (const r of rows) upsertSnap.run(date, r.ticker, r.in_decline, r.drawdown, r.rebound_rate);
  });

  return {
    upsertPrices(ticker: string, rows: PriceRow[]): void {
      upsertMany(ticker, rows);
    },
    getCloses(ticker: string): number[] {
      return (selectSeries.all(ticker) as Array<{ close: number }>).map((r) => r.close);
    },
    getSeries(ticker: string): { dates: string[]; closes: number[]; volumes: number[] } {
      const rows = selectSeries.all(ticker) as Array<{ d: string; close: number; volume: number }>;
      return {
        dates: rows.map((r) => r.d),
        closes: rows.map((r) => r.close),
        volumes: rows.map((r) => r.volume),
      };
    },
    logFetch(ticker: string, points: number, error: string | null, at?: string): void {
      const ts = at ?? new Date().toISOString();
      upsertLog.run(ticker, ts, points, error);
      if (error) insertError.run(ticker, ts, error); // R13: 이력은 append-only — 성공해도 안 지워진다
    },
    getMeta(ticker: string): FetchMeta | null {
      return (selectMeta.get(ticker) as FetchMeta | undefined) ?? null;
    },
    getErrors(): ErrorEntry[] {
      return selectErrors.all() as ErrorEntry[];
    },
    latestFetchedAt(): string | null {
      return (selectLatest.get() as { latest: string | null }).latest;
    },
    saveSnapshot(date: string, rows: SnapshotRow[]): void {
      snapMany(date, rows);
    },
    // 현재 연속 하락 구간의 시작 snap_date (003 R5 — "방문 후 진입" 판정 근거)
    declineStartDates(): Record<string, string> {
      const rows = db
        .prepare('SELECT snap_date, ticker, in_decline FROM snapshots ORDER BY snap_date ASC')
        .all() as Array<{ snap_date: string; ticker: string; in_decline: number }>;
      const last = new Map<string, number>();
      const start = new Map<string, string>();
      for (const r of rows) {
        if (r.in_decline === 1 && last.get(r.ticker) !== 1) start.set(r.ticker, r.snap_date);
        last.set(r.ticker, r.in_decline);
      }
      const out: Record<string, string> = {};
      for (const [ticker, s] of start) {
        if (last.get(ticker) === 1) out[ticker] = s;
      }
      return out;
    },
    prevSnapshot(date: string): { snapDate: string; inDecline: Map<string, boolean> } | null {
      const prev = (selectPrevDate.get(date) as { d: string | null }).d;
      if (!prev) return null;
      const m = new Map<string, boolean>();
      for (const r of selectSnap.all(prev) as Array<{ ticker: string; in_decline: number }>) {
        m.set(r.ticker, r.in_decline === 1);
      }
      return { snapDate: prev, inDecline: m };
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
