'use client';

// 탐색 표(R10) — 이 프로젝트 첫 클라이언트 컴포넌트(002 [ASSUMED 5]).
// 데이터는 서버 직렬화 props, 관심목록은 localStorage("watchlist").
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Spark } from './Spark';

export type ExplorerRow = {
  ticker: string;
  name: string;
  category: string;
  leveraged: boolean;
  note: string;
  lastClose: number | null;
  drawdown: number | null;
  rsi14: number | null;
  episodes: number;
  rebounds: number;
  reboundRate: number | null;
  wilsonLow: number | null;
  avgReboundPct: number | null;
  inDecline: boolean;
  closes60: number[];
  error: string | null;
};

type SortKey = 'ticker' | 'lastClose' | 'drawdown' | 'rsi14' | 'wilsonLow' | 'episodes';

const pct = (v: number | null, d = 1) => (v === null ? '—' : `${(v * 100).toFixed(d)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);
const num = (v: number | null, d = 0) => (v === null ? '—' : v.toFixed(d));

const WATCH_KEY = 'watchlist';

export function ExplorerTable({ rows }: { rows: ExplorerRow[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');
  const [watchOnly, setWatchOnly] = useState(false);
  const [watch, setWatch] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [desc, setDesc] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCH_KEY);
      if (raw) setWatch(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* 손상된 저장값은 무시 */
    }
  }, []);

  const toggleWatch = (ticker: string) => {
    setWatch((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      try {
        localStorage.setItem(WATCH_KEY, JSON.stringify([...next]));
      } catch {
        /* 저장 불가 환경 무시 */
      }
      return next;
    });
  };

  const cats = useMemo(() => ['전체', ...new Set(rows.map((r) => r.category))], [rows]);

  const view = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let v = rows.filter(
      (r) =>
        (cat === '전체' || r.category === cat) &&
        (!watchOnly || watch.has(r.ticker)) &&
        (qq === '' ||
          r.ticker.toLowerCase().includes(qq) ||
          r.name.toLowerCase().includes(qq)),
    );
    if (sortKey) {
      v = [...v].sort((a, b) => {
        if (sortKey === 'ticker') {
          return desc ? b.ticker.localeCompare(a.ticker) : a.ticker.localeCompare(b.ticker);
        }
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return desc ? bv - av : av - bv;
      });
    }
    return v;
  }, [rows, q, cat, watchOnly, watch, sortKey, desc]);

  const onSort = (k: SortKey) => {
    if (sortKey === k) setDesc(!desc);
    else {
      setSortKey(k);
      setDesc(true);
    }
  };

  const arrow = (k: SortKey) => (sortKey === k ? (desc ? ' ↓' : ' ↑') : '');

  return (
    <div data-testid="explorer">
      <div className="controls">
        <input
          type="search"
          aria-label="티커·이름 검색"
          placeholder="티커·이름 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select aria-label="카테고리" value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={watchOnly}
            onChange={(e) => setWatchOnly(e.target.checked)}
          />
          관심만
        </label>
        <span className="hint">{view.length}종목</span>
      </div>

      <div className="tablebox">
        <table>
          <thead>
            <tr>
              <th aria-label="관심" />
              <th>
                <button className="sortbtn" onClick={() => onSort('ticker')}>
                  티커{arrow('ticker')}
                </button>
              </th>
              <th>이름</th>
              <th>60일</th>
              <th>
                <button className="sortbtn" onClick={() => onSort('lastClose')}>
                  종가{arrow('lastClose')}
                </button>
              </th>
              <th>
                <button className="sortbtn" onClick={() => onSort('drawdown')}>
                  낙폭{arrow('drawdown')}
                </button>
              </th>
              <th>
                <button className="sortbtn" onClick={() => onSort('rsi14')}>
                  RSI{arrow('rsi14')}
                </button>
              </th>
              <th>
                <button className="sortbtn" onClick={() => onSort('episodes')}>
                  사례{arrow('episodes')}
                </button>
              </th>
              <th>
                <button className="sortbtn" onClick={() => onSort('wilsonLow')}>
                  성공률(하한){arrow('wilsonLow')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.ticker} className={r.error ? 'failed' : undefined}>
                <td>
                  <button
                    className="star"
                    aria-pressed={watch.has(r.ticker)}
                    aria-label={`${r.ticker} 관심 토글`}
                    onClick={() => toggleWatch(r.ticker)}
                  >
                    {watch.has(r.ticker) ? '★' : '☆'}
                  </button>
                </td>
                <td className="tk">
                  <Link href={`/t/${r.ticker}`}>{r.ticker}</Link>
                  {r.leveraged && <span className="badge lev">{r.note || '레버리지'}</span>}
                  {r.inDecline && <span className="badge dn">하락 중</span>}
                </td>
                <td className="nm">{r.name}</td>
                {r.error ? (
                  <td colSpan={6}>
                    <span className="badge err">조회 실패</span> {r.error}
                  </td>
                ) : (
                  <>
                    <td>
                      <Spark closes={r.closes60} />
                    </td>
                    <td className="num">{num(r.lastClose, 2)}</td>
                    <td className="num">
                      <span className={r.inDecline ? 'neg' : undefined}>{pct(r.drawdown)}</span>
                    </td>
                    <td className="num">{num(r.rsi14)}</td>
                    <td className="num">
                      {r.rebounds}/{r.episodes}
                    </td>
                    <td className="num">
                      <strong>{rate(r.reboundRate)}</strong>
                      <span className="sub"> 하한 {rate(r.wilsonLow)}</span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
