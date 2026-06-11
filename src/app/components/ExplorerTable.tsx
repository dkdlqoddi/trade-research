'use client';

// 탐색 표 (002 R10 → 003 R4 URL 동기화·R14 CSV)
// URL 반영은 history.replaceState — Next 라우터를 타면 서버 재분석이 돌아 입력마다 무거워진다(003 [ASSUMED 2])
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Spark } from './Spark';
import { useWatchlist } from './local';
import { fmt, type ScreenRow } from './rows';

type SortKey = 'ticker' | 'lastClose' | 'drawdown' | 'rsi14' | 'wilsonLow' | 'episodes';
const SORT_KEYS: SortKey[] = ['ticker', 'lastClose', 'drawdown', 'rsi14', 'wilsonLow', 'episodes'];

function readUrlState() {
  const sp = new URLSearchParams(window.location.search);
  const sort = sp.get('sort');
  return {
    q: sp.get('q') ?? '',
    cat: sp.get('cat') ?? '전체',
    sortKey: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : null,
    desc: sp.get('dir') !== 'asc',
  };
}

export function ExplorerTable({ rows }: { rows: ScreenRow[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');
  const [watchOnly, setWatchOnly] = useState(false);
  const [watch, toggleWatch] = useWatchlist();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [desc, setDesc] = useState(true);

  // R4: 초기 상태를 URL에서 복원
  useEffect(() => {
    const s = readUrlState();
    setQ(s.q);
    setCat(s.cat);
    setSortKey(s.sortKey);
    setDesc(s.desc);
  }, []);

  // R4: 상태 → URL (preset 같은 서버 파라미터는 보존)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const setOrDel = (k: string, v: string, def: string) => {
      if (v && v !== def) sp.set(k, v);
      else sp.delete(k);
    };
    setOrDel('q', q, '');
    setOrDel('cat', cat, '전체');
    setOrDel('sort', sortKey ?? '', '');
    setOrDel('dir', sortKey ? (desc ? 'desc' : 'asc') : '', '');
    const qs = sp.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [q, cat, sortKey, desc]);

  const cats = useMemo(() => ['전체', ...new Set(rows.map((r) => r.category))], [rows]);

  const view = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let v = rows.filter(
      (r) =>
        (cat === '전체' || r.category === cat) &&
        (!watchOnly || watch.has(r.ticker)) &&
        (qq === '' || r.ticker.toLowerCase().includes(qq) || r.name.toLowerCase().includes(qq)),
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
  const ariaSort = (k: SortKey) => (sortKey === k ? (desc ? 'descending' : 'ascending') : 'none');

  // R14: 현재 뷰를 CSV로 — UTF-8 BOM(엑셀 한글 호환)
  const exportCsv = () => {
    const head = ['ticker', 'name', 'category', 'leveraged', 'close', 'drawdown', 'rsi14', 'episodes', 'rebounds', 'reboundRate', 'wilsonLow', 'inDecline', 'error'];
    const cell = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const lines = [
      head.join(','),
      ...view.map((r) =>
        [r.ticker, r.name, r.category, r.leveraged, r.lastClose, r.drawdown, r.rsi14, r.episodes, r.rebounds, r.reboundRate, r.wilsonLow, r.inDecline, r.error]
          .map(cell)
          .join(','),
      ),
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `screener-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
        <button className="tool" onClick={exportCsv} aria-label="CSV 내보내기">
          ⤓ CSV
        </button>
        <span className="hint">{view.length}종목</span>
      </div>

      <div className="tablebox">
        <table className="responsive">
          <thead>
            <tr>
              <th aria-label="관심" />
              <th aria-sort={ariaSort('ticker')}>
                <button className="sortbtn" onClick={() => onSort('ticker')}>
                  티커{arrow('ticker')}
                </button>
              </th>
              <th>이름</th>
              <th>60일</th>
              <th aria-sort={ariaSort('lastClose')}>
                <button className="sortbtn" onClick={() => onSort('lastClose')}>
                  종가{arrow('lastClose')}
                </button>
              </th>
              <th aria-sort={ariaSort('drawdown')}>
                <button className="sortbtn" onClick={() => onSort('drawdown')}>
                  낙폭{arrow('drawdown')}
                </button>
              </th>
              <th aria-sort={ariaSort('rsi14')}>
                <button className="sortbtn" onClick={() => onSort('rsi14')}>
                  RSI{arrow('rsi14')}
                </button>
              </th>
              <th aria-sort={ariaSort('episodes')}>
                <button className="sortbtn" onClick={() => onSort('episodes')}>
                  사례{arrow('episodes')}
                </button>
              </th>
              <th aria-sort={ariaSort('wilsonLow')}>
                <button className="sortbtn" onClick={() => onSort('wilsonLow')}>
                  성공률(하한){arrow('wilsonLow')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.ticker} className={r.error ? 'failed' : undefined}>
                <td data-label="관심">
                  <button
                    className="star"
                    aria-pressed={watch.has(r.ticker)}
                    aria-label={`${r.ticker} 관심 토글`}
                    onClick={() => toggleWatch(r.ticker)}
                  >
                    {watch.has(r.ticker) ? '★' : '☆'}
                  </button>
                </td>
                <td className="tk" data-label="티커">
                  <Link href={`/t/${r.ticker}`}>{r.ticker}</Link>
                  {r.leveraged && <span className="badge lev">{r.note || '레버리지'}</span>}
                  {r.inDecline && <span className="badge dn">하락 중</span>}
                </td>
                <td className="nm" data-label="이름">
                  {r.name}
                </td>
                {r.error ? (
                  <td colSpan={6} data-label="상태">
                    <span className="badge err">조회 실패</span> {r.error}
                  </td>
                ) : (
                  <>
                    <td data-label="60일">
                      <Spark closes={r.closes60} />
                    </td>
                    <td className="num" data-label="종가">
                      {fmt.num(r.lastClose, 2)}
                    </td>
                    <td className="num" data-label="낙폭">
                      <span className={r.inDecline ? 'neg' : undefined}>{fmt.pct(r.drawdown)}</span>
                    </td>
                    <td className="num" data-label="RSI">
                      {fmt.num(r.rsi14)}
                    </td>
                    <td className="num" data-label="사례">
                      {r.rebounds}/{r.episodes}
                    </td>
                    <td className="num" data-label="성공률">
                      <strong>{fmt.rate(r.reboundRate)}</strong>
                      <span className="sub"> 하한 {fmt.rate(r.wilsonLow)}</span>
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
