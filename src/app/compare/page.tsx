import Link from 'next/link';
import { analyzeTicker } from '@/lib/screener/screener';
import { PRESETS, extractEpisodes } from '@/lib/screener/rebound';
import { PriceChart } from '@/app/components/PriceChart';

export const revalidate = 3600;
export const metadata = { title: '비교 — 반등 스크리너' };

const pct = (v: number | null, d = 1) => (v === null ? '—' : `${(v * 100).toFixed(d)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);

// R10 — 두 종목 나란히
async function Side({ ticker, testid }: { ticker: string; testid: string }) {
  const detail = await analyzeTicker(ticker.toUpperCase());
  if (!detail) {
    return (
      <div className="compare-side" data-testid={testid}>
        <h2>{ticker.toUpperCase()}</h2>
        <p className="empty">유니버스에 없는 티커.</p>
      </div>
    );
  }
  const { entry, dates, closes, volumes, stats } = detail;
  const p = PRESETS.default.params;
  const n = Math.min(closes.length, 252);
  const vCloses = closes.slice(-n);
  const vDates = dates.slice(-n);
  const vVolumes = volumes.slice(-n);
  const eps = extractEpisodes(vCloses, p);

  return (
    <div className="compare-side" data-testid={testid}>
      <h2>
        <Link href={`/t/${entry.ticker}`}>{entry.ticker}</Link>{' '}
        <span className="sub">{entry.name}</span>
        {entry.leveraged && <span className="badge lev">{entry.note || '레버리지'}</span>}
      </h2>
      {stats.error ? (
        <p className="empty">
          <span className="badge err">조회 실패</span> {stats.error}
        </p>
      ) : (
        <>
          <ul className="kv">
            <li>
              낙폭(60일) <b className={stats.inDecline ? 'neg' : ''}>{pct(stats.drawdown)}</b>
            </li>
            <li>
              성공률 <b>{rate(stats.reboundRate)}</b> <span className="sub">하한 {rate(stats.wilsonLow)}</span>
            </li>
            <li>
              표본 <b>{stats.rebounds}/{stats.episodes}</b>
            </li>
            <li>
              RSI <b>{stats.rsi14 === null ? '—' : Math.round(stats.rsi14)}</b>
            </li>
            <li>
              평균 MAE <b className="neg">{pct(stats.avgMae)}</b>
            </li>
          </ul>
          <PriceChart
            closes={vCloses}
            dates={vDates}
            volumes={vVolumes}
            markers={eps.map((e) => ({
              index: e.entryIndex,
              success: e.success,
              date: vDates[e.entryIndex] ?? '',
              reboundPct: e.reboundPct,
            }))}
          />
        </>
      )}
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;

  return (
    <div className="wrap">
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <header className="masthead">
        <h1>종목 비교</h1>
        <span className="sub">최근 1년 — 기본 프리셋</span>
        <span className="meta-chip">
          <Link href="/">← 대시보드</Link>
        </span>
      </header>

      <form className="compare-form" method="get" action="/compare">
        <input name="a" placeholder="티커 A (예: SOXL)" defaultValue={a ?? ''} aria-label="티커 A" />
        <span className="sub">vs</span>
        <input name="b" placeholder="티커 B (예: SOXS)" defaultValue={b ?? ''} aria-label="티커 B" />
        <button type="submit" className="tool">
          비교
        </button>
      </form>

      <main id="main">
        {a && b ? (
          <div className="compare-grid">
            <Side ticker={a} testid="compare-a" />
            <Side ticker={b} testid="compare-b" />
          </div>
        ) : (
          <p className="empty">두 티커를 입력하면 통계·차트를 나란히 보여준다.</p>
        )}
      </main>

      <footer>
        <p>
          ⚠️ 과거 빈도 통계 — <strong>투자 조언이 아닙니다</strong>.{' '}
          <Link href="/methodology">방법론과 한계</Link>
        </p>
      </footer>
    </div>
  );
}
