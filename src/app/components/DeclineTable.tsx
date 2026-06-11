'use client';

// 하락·신규 진입·관심 구간 공용 표 (003 R7 정렬·R13 aria-sort·R2 카드형·R5 방문 배지)
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Spark } from './Spark';
import { TERMS } from './terms';
import { useLastVisit } from './local';
import { fmt, type ScreenRow } from './rows';

type SortKey = 'ticker' | 'lastClose' | 'drawdown' | 'rsi14' | 'episodes' | 'wilsonLow' | 'avgReboundPct';

const COLS: Array<{ key: SortKey | null; label: string; info?: keyof typeof TERMS }> = [
  { key: 'ticker', label: '티커' },
  { key: null, label: '이름' },
  { key: null, label: '60일' },
  { key: 'lastClose', label: '종가' },
  { key: 'drawdown', label: '낙폭', info: 'drawdown' },
  { key: 'rsi14', label: 'RSI' },
  { key: 'episodes', label: '반등/사례' },
  { key: 'wilsonLow', label: '성공률(윌슨 하한)', info: 'wilson' },
  { key: 'avgReboundPct', label: '평균 회복폭' },
];

export function DeclineTable({
  rows,
  defaultSort = null,
}: {
  rows: ScreenRow[];
  defaultSort?: SortKey | null;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>(defaultSort);
  const [desc, setDesc] = useState(true);
  const lastVisit = useLastVisit();

  const view = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
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
  }, [rows, sortKey, desc]);

  const onSort = (k: SortKey) => {
    if (sortKey === k) setDesc(!desc);
    else {
      setSortKey(k);
      setDesc(true);
    }
  };

  // 방문 이후 진입 배지(R5): 하락 시작일이 직전 방문 이후
  const visitBadge = (r: ScreenRow) =>
    lastVisit && r.declineStart && r.declineStart > lastVisit.slice(0, 10);

  return (
    <div className="tablebox">
      <table className="responsive">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th
                key={c.label}
                aria-sort={
                  c.key === null ? undefined : sortKey === c.key ? (desc ? 'descending' : 'ascending') : 'none'
                }
              >
                {c.key ? (
                  <button className="sortbtn" onClick={() => onSort(c.key!)}>
                    {c.label}
                    {sortKey === c.key ? (desc ? ' ↓' : ' ↑') : ''}
                  </button>
                ) : (
                  c.label
                )}
                {c.info && (
                  <a className="info" href={TERMS[c.info].anchor} title={TERMS[c.info].title}>
                    ⓘ<span className="sr-only">{c.label} 설명</span>
                  </a>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.map((s) => (
            <tr key={s.ticker}>
              <td className="tk" data-label="티커">
                <Link href={`/t/${s.ticker}`}>{s.ticker}</Link>
                {s.leveraged && <span className="badge lev">{s.note || '레버리지'}</span>}
                {s.isNewEntry && <span className="badge new">신규</span>}
                {visitBadge(s) && <span className="badge visit">방문 후 진입</span>}
              </td>
              <td className="nm" data-label="이름">
                {s.name}
              </td>
              <td data-label="60일">
                <Spark closes={s.closes60} />
              </td>
              <td className="num" data-label="종가">
                {fmt.num(s.lastClose, 2)}
              </td>
              <td className="num" data-label="낙폭">
                <span className="neg">{fmt.pct(s.drawdown)}</span>
                <span className="gauge dd" aria-hidden="true">
                  <i
                    style={{
                      width: `${Math.round((Math.min(Math.abs(s.drawdown ?? 0), 0.5) / 0.5) * 100)}%`,
                    }}
                  />
                </span>
              </td>
              <td className="num" data-label="RSI">
                {fmt.num(s.rsi14)}
              </td>
              <td className="num" data-label="반등/사례">
                {s.rebounds}/{s.episodes}
                {s.episodes > 0 && s.episodes < 5 && <span className="badge few">표본 부족</span>}
              </td>
              <td className="num rate-cell" data-label="성공률">
                <strong>{fmt.rate(s.reboundRate)}</strong>
                <span className="sub"> 하한 {fmt.rate(s.wilsonLow)}</span>
                <span className="gauge" aria-hidden="true">
                  <i style={{ width: `${Math.round((s.wilsonLow ?? 0) * 100)}%` }} />
                </span>
              </td>
              <td className="num" data-label="평균 회복폭">
                {fmt.pct(s.avgReboundPct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
