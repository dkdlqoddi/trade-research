'use client';

// 관심 구간 상단 고정 (003 R6) — 관심목록이 비어 있으면 렌더하지 않는다
import { useWatchlist } from './local';
import { DeclineTable } from './DeclineTable';
import type { ScreenRow } from './rows';

export function WatchSection({ rows }: { rows: ScreenRow[] }) {
  const [watch] = useWatchlist();

  if (watch.size === 0) return null;
  const mine = rows.filter((r) => watch.has(r.ticker) && !r.error);
  if (mine.length === 0) return null;

  const declining = mine.filter((r) => r.inDecline).length;

  return (
    <section data-testid="watch-section" className="watch-section">
      <div className="sec-head">
        <h2>관심 종목</h2>
        <span className="count">{mine.length}</span>
        <span className="desc">
          {declining > 0 ? `하락 중 ${declining}건 — 확인 필요` : '전부 하락 구간 밖'}
        </span>
      </div>
      <DeclineTable rows={mine} />
    </section>
  );
}
