import { analyzeUniverse, sortByReboundRate, type TickerStats } from '@/lib/screener/screener';
import { lastFetchedAt } from '@/lib/screener/marketdata';
import { PARAMS } from '@/lib/screener/rebound';

export const revalidate = 3600; // ISR 1시간 — 렌더 캐시. 수집 캐시(24h)는 SQLite가 담당(R8·R9)

const pct = (v: number | null, digits = 1) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);
const num = (v: number | null, digits = 0) => (v === null ? '—' : v.toFixed(digits));

function Gauge({ ratio, kind }: { ratio: number; kind?: 'dd' }) {
  const w = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  return (
    <span className={`gauge${kind === 'dd' ? ' dd' : ''}`} aria-hidden="true">
      <i style={{ width: `${w}%` }} />
    </span>
  );
}

function StatsRow({ s }: { s: TickerStats }) {
  if (s.error) {
    return (
      <tr className="failed">
        <td className="tk">{s.ticker}</td>
        <td className="nm">{s.name}</td>
        <td className="ct">{s.category}</td>
        <td colSpan={6}>
          <span className="badge err">조회 실패</span> {s.error}
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td className="tk">
        {s.ticker}
        {s.leveraged && <span className="badge lev">{s.note || '레버리지'}</span>}
      </td>
      <td className="nm">{s.name}</td>
      <td className="ct">{s.category}</td>
      <td className="num">{num(s.lastClose, 2)}</td>
      <td className="num">
        <span className={s.inDecline ? 'neg' : undefined}>{pct(s.drawdown)}</span>
        <Gauge ratio={Math.min(Math.abs(s.drawdown ?? 0), 0.5) / 0.5} kind="dd" />
      </td>
      <td className="num">{num(s.rsi14)}</td>
      <td className="num">
        {s.rebounds}/{s.episodes}
        {s.episodes > 0 && s.episodes < PARAMS.MIN_SAMPLES && (
          <span className="badge few">표본 부족</span>
        )}
      </td>
      <td className="num rate-cell">
        <strong>{rate(s.reboundRate)}</strong>
        <Gauge ratio={s.reboundRate ?? 0} />
      </td>
      <td className="num">{pct(s.avgReboundPct)}</td>
    </tr>
  );
}

function StatsTable({ rows }: { rows: TickerStats[] }) {
  return (
    <div className="tablebox">
      <table>
        <thead>
          <tr>
            <th>티커</th>
            <th>이름</th>
            <th>카테고리</th>
            <th>종가</th>
            <th>낙폭(60일)</th>
            <th>RSI</th>
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
    </div>
  );
}

export default async function Home() {
  const stats = await analyzeUniverse();
  const fetched = lastFetchedAt();

  const declining = stats.filter((s) => !s.error && s.inDecline).sort(sortByReboundRate);
  const others = stats.filter((s) => !s.error && !s.inDecline);
  const failed = stats.filter((s) => s.error);

  const nEtf = stats.filter((s) => s.category.includes('ETF')).length;
  const nStock = stats.length - nEtf;
  const rated = declining.filter((s) => s.reboundRate !== null);
  const avgRate =
    rated.length > 0 ? rated.reduce((a, s) => a + (s.reboundRate ?? 0), 0) / rated.length : null;

  return (
    <div className="wrap">
      <header className="masthead">
        <h1>미국 주식 반등 스크리너</h1>
        <span className="sub">하락 이후 반등 빈도 — 과거 일봉 백테스트</span>
        <span className="meta-chip" data-testid="meta-fetched">
          수집 <b>{fetched ? fetched.slice(0, 16).replace('T', ' ') : '—'}</b> · SQLite
        </span>
      </header>

      <p className="params">
        정의: 최근 <code>{PARAMS.HIGH_WINDOW}</code>거래일 고점 대비{' '}
        <code>{Math.round(PARAMS.ENTRY_DD * -100)}%</code> 하향 돌파 후{' '}
        <code>{PARAMS.HORIZON}</code>거래일 내 <code>+{Math.round(PARAMS.TARGET * 100)}%</code>{' '}
        회복한 빈도 · 보조지표 RSI(<code>{PARAMS.RSI_PERIOD}</code>) · 데이터{' '}
        <code>data/stock-universe.md</code> → SQLite 캐시(24h)
      </p>

      <div className="cards" data-testid="summary-cards">
        <div className="card">
          <div className="label">유니버스</div>
          <div className="value">{stats.length}</div>
          <div className="hint">
            주식 {nStock} · ETF {nEtf}
          </div>
        </div>
        <div className="card">
          <div className="label">지금 하락 중</div>
          <div className="value down">{declining.length}</div>
          <div className="hint">60일 고점 대비 −{Math.round(PARAMS.ENTRY_DD * -100)}% 이상</div>
        </div>
        <div className="card">
          <div className="label">반등 성공률</div>
          <div className="value up">{rate(avgRate)}</div>
          <div className="hint">하락군 평균(과거 빈도)</div>
        </div>
        <div className="card">
          <div className="label">조회 실패</div>
          <div className={`value${failed.length > 0 ? ' warn' : ''}`}>{failed.length}</div>
          <div className="hint">종목 단위 격리(R4)</div>
        </div>
      </div>

      <section data-testid="decline-section">
        <div className="sec-head">
          <h2>지금 하락 중</h2>
          <span className="count">{declining.length}</span>
          <span className="desc">과거 반등 성공률 내림차순 — 표본 5건 미만은 참고만</span>
        </div>
        {declining.length > 0 ? (
          <StatsTable rows={declining} />
        ) : (
          <p>현재 하락 상태인 종목이 없다.</p>
        )}
      </section>

      <section data-testid="all-section">
        <div className="sec-head">
          <h2>나머지 전 종목</h2>
          <span className="count">{others.length + failed.length}</span>
        </div>
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
    </div>
  );
}
