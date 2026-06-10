import Link from 'next/link';
import { analyzeUniverse, sortByWilson, type TickerStats } from '@/lib/screener/screener';
import { lastFetchedAt } from '@/lib/screener/marketdata';
import { getStore } from '@/lib/screener/db';
import { PRESETS, type PresetKey } from '@/lib/screener/rebound';
import { Spark } from './components/Spark';
import { ExplorerTable } from './components/ExplorerTable';

export const revalidate = 3600; // ISR 1시간 — 렌더 캐시. 수집 캐시(24h)는 SQLite가 담당(R8·R9)

const pct = (v: number | null, digits = 1) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);
const num = (v: number | null, digits = 0) => (v === null ? '—' : v.toFixed(digits));

function resolvePreset(raw: string | undefined): PresetKey {
  return raw && raw in PRESETS ? (raw as PresetKey) : 'default';
}

function DeclineRow({ s }: { s: TickerStats }) {
  return (
    <tr>
      <td className="tk">
        <Link href={`/t/${s.ticker}`}>{s.ticker}</Link>
        {s.leveraged && <span className="badge lev">{s.note || '레버리지'}</span>}
        {s.isNewEntry && <span className="badge new">신규</span>}
      </td>
      <td className="nm">{s.name}</td>
      <td>
        <Spark closes={s.closes60} />
      </td>
      <td className="num">{num(s.lastClose, 2)}</td>
      <td className="num">
        <span className="neg">{pct(s.drawdown)}</span>
        <span className="gauge dd" aria-hidden="true">
          <i style={{ width: `${Math.round((Math.min(Math.abs(s.drawdown ?? 0), 0.5) / 0.5) * 100)}%` }} />
        </span>
      </td>
      <td className="num">{num(s.rsi14)}</td>
      <td className="num">
        {s.rebounds}/{s.episodes}
        {s.episodes > 0 && s.episodes < 5 && <span className="badge few">표본 부족</span>}
      </td>
      <td className="num rate-cell">
        <strong>{rate(s.reboundRate)}</strong>
        <span className="sub"> 하한 {rate(s.wilsonLow)}</span>
        <span className="gauge" aria-hidden="true">
          <i style={{ width: `${Math.round((s.wilsonLow ?? 0) * 100)}%` }} />
        </span>
      </td>
      <td className="num">{pct(s.avgReboundPct)}</td>
    </tr>
  );
}

function DeclineTable({ rows }: { rows: TickerStats[] }) {
  return (
    <div className="tablebox">
      <table>
        <thead>
          <tr>
            <th>티커</th>
            <th>이름</th>
            <th>60일</th>
            <th>종가</th>
            <th>낙폭</th>
            <th>RSI</th>
            <th>반등/사례</th>
            <th>성공률(윌슨 하한)</th>
            <th>평균 회복폭</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <DeclineRow key={s.ticker} s={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const preset = resolvePreset((await searchParams).preset);
  const p = PRESETS[preset].params;
  const stats = await analyzeUniverse(preset);
  const fetched = lastFetchedAt();
  const errors = getStore().getErrors();

  const declining = stats.filter((s) => !s.error && s.inDecline).sort(sortByWilson);
  const newEntries = declining.filter((s) => s.isNewEntry);
  const failed = stats.filter((s) => s.error);
  const spy = stats.find((s) => s.ticker === 'SPY' && !s.error);

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
        {spy && (
          <span
            className={`chip ${spy.inDecline ? 'warn' : 'ok'}`}
            data-testid="regime-chip"
            title="SPY 60일 고점 대비 낙폭 기준"
          >
            {spy.inDecline ? '시장 하락 국면' : '시장 정상'} (SPY {pct(spy.drawdown)})
          </span>
        )}
        <span className="meta-chip" data-testid="meta-fetched">
          수집 <b>{fetched ? fetched.slice(0, 16).replace('T', ' ') : '—'}</b> · SQLite
        </span>
      </header>

      <nav className="preset-nav" data-testid="preset-nav" aria-label="프리셋">
        {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
          <Link
            key={k}
            href={k === 'default' ? '/' : `/?preset=${k}`}
            aria-current={k === preset ? 'page' : undefined}
          >
            {PRESETS[k].label}
          </Link>
        ))}
      </nav>

      <p className="params">
        정의: 최근 <code>{p.HIGH_WINDOW}</code>거래일 고점 대비{' '}
        <code>{Math.round(p.ENTRY_DD * -100)}%</code> 하향 돌파 후 <code>{p.HORIZON}</code>거래일 내{' '}
        <code>+{Math.round(p.TARGET * 100)}%</code> 회복한 빈도 · 정렬은 윌슨 95% 하한 ·{' '}
        <Link href="/methodology">방법론과 한계</Link>
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
          <div className="hint">신규 진입 {newEntries.length}</div>
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

      <section data-testid="new-entries" className="new-entries">
        <div className="sec-head">
          <h2>오늘 신규 진입</h2>
          <span className="count">{newEntries.length}</span>
          <span className="desc">직전 스냅샷에서는 하락 상태가 아니었던 종목</span>
        </div>
        {newEntries.length > 0 ? (
          <DeclineTable rows={newEntries} />
        ) : (
          <p className="empty">신규 진입 없음 — 직전 스냅샷 대비 변화가 없다.</p>
        )}
      </section>

      <section data-testid="decline-section">
        <div className="sec-head">
          <h2>지금 하락 중</h2>
          <span className="count">{declining.length}</span>
          <span className="desc">윌슨 하한 내림차순 — 소표본 100%는 아래로 깔린다</span>
        </div>
        {declining.length > 0 ? (
          <DeclineTable rows={declining} />
        ) : (
          <p className="empty">현재 하락 상태인 종목이 없다.</p>
        )}
      </section>

      <section data-testid="all-section">
        <div className="sec-head">
          <h2>전 종목 탐색</h2>
          <span className="count">{stats.length}</span>
          <span className="desc">검색 · 카테고리 · 정렬 · 관심목록(브라우저 저장)</span>
        </div>
        <ExplorerTable
          rows={stats.map((s) => ({
            ticker: s.ticker,
            name: s.name,
            category: s.category,
            leveraged: s.leveraged,
            note: s.note,
            lastClose: s.lastClose,
            drawdown: s.drawdown,
            rsi14: s.rsi14,
            episodes: s.episodes,
            rebounds: s.rebounds,
            reboundRate: s.reboundRate,
            wilsonLow: s.wilsonLow,
            avgReboundPct: s.avgReboundPct,
            inDecline: s.inDecline,
            closes60: s.closes60,
            error: s.error,
          }))}
        />
      </section>

      <details className="quality" data-testid="quality-panel">
        <summary>데이터 품질 — 오류 이력 {errors.length}건(최근 50)</summary>
        {errors.length > 0 ? (
          <ul>
            {errors.map((e) => (
              <li key={e.id}>
                <span className="tk">{e.ticker}</span> — {e.error}{' '}
                <span className="sub">({e.at.slice(0, 16).replace('T', ' ')})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">오류 없음.</p>
        )}
      </details>

      <footer>
        <p>
          ⚠️ 이 표는 과거 일봉의 빈도 통계이며 <strong>투자 조언이 아닙니다</strong>. 과거 반등
          빈도는 미래 수익을 보장하지 않는다. <Link href="/methodology">방법론과 한계</Link> 참조.
        </p>
        <p>
          ⚠️ 레버리지 ETF는 일일 수익률의 배수를 추적한다 — <strong>변동성 잠식</strong>(volatility
          decay)으로 장기 보유 시 기초지수 배수와 괴리가 커진다.
        </p>
      </footer>
    </div>
  );
}
