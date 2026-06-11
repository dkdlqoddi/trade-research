import Link from 'next/link';
import { analyzeUniverse, sortByWilson, type TickerStats } from '@/lib/screener/screener';
import { lastFetchedAt } from '@/lib/screener/marketdata';
import { getStore } from '@/lib/screener/db';
import { PRESETS, type PresetKey } from '@/lib/screener/rebound';
import { ExplorerTable } from './components/ExplorerTable';
import { DeclineTable } from './components/DeclineTable';
import { WatchSection } from './components/WatchSection';
import { HeaderControls } from './components/HeaderControls';
import type { ScreenRow } from './components/rows';

export const revalidate = 3600; // ISR 1시간 — 렌더 캐시. 수집 캐시(24h)는 SQLite가 담당(R8·R9)

const pct = (v: number | null, digits = 1) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);

function resolvePreset(raw: string | undefined): PresetKey {
  return raw && raw in PRESETS ? (raw as PresetKey) : 'default';
}

function toRow(s: TickerStats, declineStarts: Record<string, string>): ScreenRow {
  return {
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
    isNewEntry: s.isNewEntry,
    declineStart: declineStarts[s.ticker] ?? null,
    closes60: s.closes60,
    error: s.error,
  };
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

  let errors: ReturnType<ReturnType<typeof getStore>['getErrors']> = [];
  let declineStarts: Record<string, string> = {};
  let prevSnapDate: string | null = null;
  try {
    const store = getStore();
    errors = store.getErrors();
    declineStarts = store.declineStartDates();
    prevSnapDate = store.prevSnapshot(new Date().toISOString().slice(0, 10))?.snapDate ?? null;
  } catch {
    /* 읽기 실패는 페이지를 죽이지 않는다 */
  }

  const rows = stats.map((s) => toRow(s, declineStarts));
  const declining = stats.filter((s) => !s.error && s.inDecline).sort(sortByWilson);
  const decliningRows = declining.map((s) => toRow(s, declineStarts));
  const newEntryRows = decliningRows.filter((s) => s.isNewEntry);
  const failed = stats.filter((s) => s.error);
  const spy = stats.find((s) => s.ticker === 'SPY' && !s.error);

  const nEtf = stats.filter((s) => s.category.includes('ETF')).length;
  const nStock = stats.length - nEtf;
  const rated = declining.filter((s) => s.reboundRate !== null);
  const avgRate =
    rated.length > 0 ? rated.reduce((a, s) => a + (s.reboundRate ?? 0), 0) / rated.length : null;

  return (
    <div className="wrap">
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
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
        <HeaderControls />
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
        <Link href="/methodology">방법론과 한계</Link> · <Link href="/compare">비교</Link>
      </p>

      <main id="main">
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
            <div className="hint">신규 진입 {newEntryRows.length}</div>
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

        <WatchSection rows={rows} />

        <section data-testid="new-entries" className="new-entries">
          <div className="sec-head">
            <h2>오늘 신규 진입</h2>
            <span className="count">{newEntryRows.length}</span>
            <span className="desc">직전 스냅샷 {prevSnapDate ?? '없음(첫 가동)'} 대비</span>
          </div>
          {newEntryRows.length > 0 ? (
            <DeclineTable rows={newEntryRows} />
          ) : (
            <p className="empty">
              신규 진입 없음 — 직전 스냅샷({prevSnapDate ?? '없음'}) 이후 변화가 없다.
            </p>
          )}
        </section>

        <section data-testid="decline-section">
          <div className="sec-head">
            <h2>지금 하락 중</h2>
            <span className="count">{declining.length}</span>
            <span className="desc">윌슨 하한 내림차순 — 머리글 클릭으로 재정렬</span>
          </div>
          {decliningRows.length > 0 ? (
            <DeclineTable rows={decliningRows} />
          ) : (
            <p className="empty">현재 하락 상태인 종목이 없다.</p>
          )}
        </section>

        <section data-testid="all-section">
          <div className="sec-head">
            <h2>전 종목 탐색</h2>
            <span className="count">{stats.length}</span>
            <span className="desc">검색·정렬 상태는 URL에 유지된다 — 공유 가능</span>
          </div>
          <ExplorerTable rows={rows} />
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
      </main>

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
