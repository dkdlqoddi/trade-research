import { analyzeUniverse, sortByReboundRate, type TickerStats } from '@/lib/screener/screener';
import { PARAMS } from '@/lib/screener/rebound';

export const revalidate = 3600; // ISR 1시간 — 시세 호출 최소화 (specs/001 [ASSUMED] 1)

const pct = (v: number | null, digits = 1) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);
const num = (v: number | null, digits = 0) => (v === null ? '—' : v.toFixed(digits));

function StatsRow({ s }: { s: TickerStats }) {
  if (s.error) {
    return (
      <tr className="failed">
        <td>{s.ticker}</td>
        <td>{s.name}</td>
        <td>{s.category}</td>
        <td colSpan={6}>
          <span className="badge fail">조회 실패</span> {s.error}
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td>
        {s.ticker} {s.leveraged && <span className="badge lev">레버리지</span>}
      </td>
      <td>{s.name}</td>
      <td>{s.category}</td>
      <td className="num">{num(s.lastClose, 2)}</td>
      <td className="num">{pct(s.drawdown)}</td>
      <td className="num">{num(s.rsi14)}</td>
      <td className="num">
        {s.rebounds}/{s.episodes}
        {s.episodes > 0 && s.episodes < PARAMS.MIN_SAMPLES && (
          <span className="badge thin"> 표본 부족</span>
        )}
      </td>
      <td className="num strong">{rate(s.reboundRate)}</td>
      <td className="num">{pct(s.avgReboundPct)}</td>
    </tr>
  );
}

function StatsTable({ rows }: { rows: TickerStats[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>티커</th>
          <th>이름</th>
          <th>카테고리</th>
          <th>종가</th>
          <th>낙폭(60일 고점比)</th>
          <th>RSI(14)</th>
          <th>반등/사례</th>
          <th>반등 성공률</th>
          <th>평균 회복폭</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <StatsRow key={s.ticker} s={s} />
        ))}
      </tbody>
    </table>
  );
}

export default async function Home() {
  const stats = await analyzeUniverse();
  const declining = stats.filter((s) => !s.error && s.inDecline).sort(sortByReboundRate);
  const others = stats.filter((s) => !s.error && !s.inDecline);
  const failed = stats.filter((s) => s.error);

  return (
    <main>
      <style>{css}</style>
      <h1>미국 주식 반등 스크리너</h1>
      <p className="intro">
        유니버스(<code>data/stock-universe.md</code>) {stats.length}종목 · 정의: 최근{' '}
        {PARAMS.HIGH_WINDOW}거래일 고점 대비 {Math.round(PARAMS.ENTRY_DD * -100)}% 하향 돌파 후{' '}
        {PARAMS.HORIZON}거래일 내 +{Math.round(PARAMS.TARGET * 100)}% 회복한 과거 빈도 ·
        보조지표 RSI({PARAMS.RSI_PERIOD})
      </p>

      <section data-testid="decline-section">
        <h2>지금 하락 중 — 과거 반등 성공률 순 ({declining.length})</h2>
        {declining.length > 0 ? (
          <StatsTable rows={declining} />
        ) : (
          <p>현재 하락 상태(−{Math.round(PARAMS.ENTRY_DD * -100)}% 이상)인 종목이 없다.</p>
        )}
      </section>

      <section data-testid="all-section">
        <h2>나머지 전 종목 ({others.length + failed.length})</h2>
        <StatsTable rows={[...others, ...failed]} />
      </section>

      <footer>
        <p>
          ⚠️ 이 표는 과거 일봉의 빈도 통계이며 <strong>투자 조언이 아닙니다</strong>. 과거 반등
          빈도는 미래 수익을 보장하지 않는다.
        </p>
        <p>
          ⚠️ 레버리지 ETF는 일일 수익률의 배수를 추적한다 — <strong>변동성 잠식</strong>(volatility
          decay)으로 장기 보유 시 기초지수 배수와 괴리가 커진다.
        </p>
      </footer>
    </main>
  );
}

const css = `
  main { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
         max-width: 1080px; margin: 1.5rem auto; padding: 0 1rem; line-height: 1.55; color: #1a1a1a; }
  h1 { font-size: 1.45rem; border-bottom: 2px solid #ddd; padding-bottom: .5rem; }
  h2 { font-size: 1.05rem; margin-top: 1.8rem; }
  .intro { color: #555; font-size: .9rem; }
  table { border-collapse: collapse; width: 100%; font-size: .87rem; }
  th, td { border-bottom: 1px solid #e3e3e3; padding: .42rem .55rem; text-align: left; }
  th { background: #f6f6f6; font-weight: 600; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.strong { font-weight: 700; }
  tr.failed td { color: #6e5527; background: #fcf8e3; }
  .badge { font-size: .72rem; padding: .05rem .4rem; border-radius: .6rem; vertical-align: middle; }
  .badge.lev { background: #fde2e2; color: #b71c1c; }
  .badge.fail { background: #fff0c2; color: #6e5300; }
  .badge.thin { color: #6b6b6b; background: none; padding: 0; }
  footer { margin-top: 2rem; border-top: 1px solid #ddd; padding-top: .9rem; color: #555; font-size: .85rem; }
`;
