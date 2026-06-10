import Link from 'next/link';
import { notFound } from 'next/navigation';
import { analyzeTicker } from '@/lib/screener/screener';
import { PRESETS, type PresetKey } from '@/lib/screener/rebound';

export const revalidate = 3600;

const pct = (v: number | null, digits = 1) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);
const num = (v: number | null, digits = 2) => (v === null ? '—' : v.toFixed(digits));

function resolvePreset(raw: string | undefined): PresetKey {
  return raw && raw in PRESETS ? (raw as PresetKey) : 'default';
}

// 2년 가격 차트 + 진입 마커(R8) — 서버 SVG, 의존성 0
function PriceChart({
  closes,
  markers,
}: {
  closes: number[];
  markers: Array<{ index: number; success: boolean }>;
}) {
  const W = 920;
  const H = 260;
  const PAD = 8;
  if (closes.length < 2) return <p className="empty">차트 데이터 없음.</p>;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (closes.length - 1)) * (W - PAD * 2);
  const y = (c: number) => H - PAD - ((c - min) / span) * (H - PAD * 2);
  const pts = closes.map((c, i) => `${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(' ');
  return (
    <svg
      className="chart"
      data-testid="price-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="2년 가격 차트와 과거 진입 시점"
    >
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.6" />
      {markers.map((m) => (
        <circle
          key={m.index}
          cx={x(m.index)}
          cy={y(closes[m.index])}
          r="4.5"
          fill={m.success ? 'var(--up)' : 'var(--down)'}
          stroke="var(--bg)"
          strokeWidth="1.5"
        />
      ))}
      <text x={PAD} y={12} className="axis">
        {max.toFixed(2)}
      </text>
      <text x={PAD} y={H - 2} className="axis">
        {min.toFixed(2)}
      </text>
    </svg>
  );
}

export default async function TickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ preset?: string }>;
}) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase();
  const preset = resolvePreset((await searchParams).preset);
  const detail = await analyzeTicker(ticker, preset);
  if (!detail) notFound();

  const { entry, dates, closes, episodes, stats } = detail;
  const p = PRESETS[preset].params;

  return (
    <div className="wrap">
      <header className="masthead">
        <h1>
          {entry.ticker} <span className="sub">{entry.name}</span>
        </h1>
        <span className="ct">{entry.category}</span>
        {entry.leveraged && <span className="badge lev">{entry.note || '레버리지'}</span>}
        {stats.inDecline && <span className="chip warn">지금 하락 중</span>}
        <span className="meta-chip">
          <Link href="/">← 대시보드</Link>
        </span>
      </header>

      {stats.error ? (
        <p className="empty">
          <span className="badge err">조회 실패</span> {stats.error}
        </p>
      ) : (
        <>
          <div className="cards">
            <div className="card">
              <div className="label">현재 낙폭(60일)</div>
              <div className={`value${stats.inDecline ? ' down' : ''}`}>{pct(stats.drawdown)}</div>
              <div className="hint">종가 {num(stats.lastClose)}</div>
            </div>
            <div className="card">
              <div className="label">반등 성공률</div>
              <div className="value up">{rate(stats.reboundRate)}</div>
              <div className="hint">
                윌슨 하한 {rate(stats.wilsonLow)} · 표본 {stats.episodes}
              </div>
            </div>
            <div className="card">
              <div className="label">평균 회복 소요</div>
              <div className="value">
                {stats.avgRecoveryDays === null ? '—' : stats.avgRecoveryDays.toFixed(1)}
              </div>
              <div className="hint">거래일(성공 사례)</div>
            </div>
            <div className="card">
              <div className="label">평균 MAE</div>
              <div className="value warn">{pct(stats.avgMae)}</div>
              <div className="hint">진입 후 관찰 구간 최저</div>
            </div>
          </div>

          <section>
            <div className="sec-head">
              <h2>2년 가격 + 진입 마커</h2>
              <span className="desc">
                ● 성공 / ● 실패 — 프리셋: {PRESETS[preset].label}(−
                {Math.round(p.ENTRY_DD * -100)}%/{p.HORIZON}일/+{Math.round(p.TARGET * 100)}%)
              </span>
            </div>
            <PriceChart
              closes={closes}
              markers={episodes.map((e) => ({ index: e.entryIndex, success: e.success }))}
            />
          </section>

          <section>
            <div className="sec-head">
              <h2>보조지표</h2>
            </div>
            <div className="cards">
              <div className="card">
                <div className="label">MA50 이격</div>
                <div className="value">{pct(stats.maDist50)}</div>
              </div>
              <div className="card">
                <div className="label">MA200 이격</div>
                <div className="value">{pct(stats.maDist200)}</div>
              </div>
              <div className="card">
                <div className="label">볼린저 %B</div>
                <div className="value">{stats.pctB === null ? '—' : stats.pctB.toFixed(2)}</div>
              </div>
              <div className="card">
                <div className="label">거래량 급증</div>
                <div className="value">
                  {stats.volSurge === null ? '—' : `${stats.volSurge.toFixed(2)}×`}
                </div>
                <div className="hint">최근 5일 / 직전 60일</div>
              </div>
              <div className="card">
                <div className="label">RSI(14)</div>
                <div className="value">{stats.rsi14 === null ? '—' : Math.round(stats.rsi14)}</div>
              </div>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <h2>과거 반등 사례</h2>
              <span className="count">{episodes.length}</span>
            </div>
            <div className="tablebox" data-testid="episode-table">
              <table>
                <thead>
                  <tr>
                    <th>진입일</th>
                    <th>진입가</th>
                    <th>결과</th>
                    <th>최대 회복</th>
                    <th>MAE</th>
                    <th>목표 도달</th>
                  </tr>
                </thead>
                <tbody>
                  {episodes.map((e) => (
                    <tr key={e.entryIndex}>
                      <td className="tk">{dates[e.entryIndex] ?? `#${e.entryIndex}`}</td>
                      <td className="num">{e.entryClose.toFixed(2)}</td>
                      <td>
                        {e.success ? (
                          <span className="badge ok">성공</span>
                        ) : (
                          <span className="badge err">실패</span>
                        )}
                      </td>
                      <td className="num">{pct(e.reboundPct)}</td>
                      <td className="num neg">{pct(e.mae)}</td>
                      <td className="num">{e.daysToTarget === null ? '—' : `${e.daysToTarget}일`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <footer>
        <p>
          ⚠️ 과거 빈도 통계 — <strong>투자 조언이 아닙니다</strong>.{' '}
          <Link href="/methodology">방법론과 한계</Link>
        </p>
      </footer>
    </div>
  );
}
