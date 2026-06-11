import Link from 'next/link';
import { notFound } from 'next/navigation';
import { analyzeTicker, analyzeUniverse, sortByWilson } from '@/lib/screener/screener';
import { PRESETS, extractEpisodes, type PresetKey } from '@/lib/screener/rebound';
import { PriceChart } from '@/app/components/PriceChart';
import { TERMS } from '@/app/components/terms';

export const revalidate = 3600;

const pct = (v: number | null, digits = 1) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
const rate = (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`);
const num = (v: number | null, digits = 2) => (v === null ? '—' : v.toFixed(digits));

const RANGES = { '6m': { label: '6M', days: 126 }, '1y': { label: '1Y', days: 252 }, '2y': { label: '2Y', days: Infinity } } as const;
type RangeKey = keyof typeof RANGES;

function resolvePreset(raw: string | undefined): PresetKey {
  return raw && raw in PRESETS ? (raw as PresetKey) : 'default';
}
function resolveRange(raw: string | undefined): RangeKey {
  return raw && raw in RANGES ? (raw as RangeKey) : '2y';
}

function Info({ k }: { k: keyof typeof TERMS }) {
  return (
    <a className="info" href={TERMS[k].anchor} title={TERMS[k].title}>
      ⓘ
    </a>
  );
}

export default async function TickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ preset?: string; range?: string }>;
}) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase();
  const sp = await searchParams;
  const preset = resolvePreset(sp.preset);
  const range = resolveRange(sp.range);
  const detail = await analyzeTicker(ticker, preset);
  if (!detail) notFound();

  const { entry, dates, closes, volumes, episodes, stats } = detail;
  const p = PRESETS[preset].params;

  // R9: 이웃 탐색 — 기본 프리셋 하락 정렬 기준
  const all = await analyzeUniverse('default');
  const declining = all.filter((s) => !s.error && s.inDecline).sort(sortByWilson);
  const idx = declining.findIndex((s) => s.ticker === ticker);
  const prev = idx > 0 ? declining[idx - 1] : null;
  const next = idx >= 0 && idx < declining.length - 1 ? declining[idx + 1] : null;
  const compareWith = next?.ticker ?? prev?.ticker ?? 'SPY';

  // R8: 기간 슬라이스 — 차트 마커는 보이는 구간 기준 재추출(사례 표는 전체 시계열)
  const n = RANGES[range].days === Infinity ? closes.length : Math.min(closes.length, RANGES[range].days);
  const vCloses = closes.slice(-n);
  const vDates = dates.slice(-n);
  const vVolumes = volumes.slice(-n);
  const vEpisodes = extractEpisodes(vCloses, p);

  return (
    <div className="wrap">
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
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

      <nav className="neighbor-nav" data-testid="neighbor-nav" aria-label="이웃 종목">
        {prev ? (
          <Link href={`/t/${prev.ticker}`}>← {prev.ticker}</Link>
        ) : (
          <span className="sub">←</span>
        )}
        <span className="sub">
          {idx >= 0 ? `하락 구간 ${idx + 1}/${declining.length}` : '하락 구간 밖'}
        </span>
        {next ? (
          <Link href={`/t/${next.ticker}`}>{next.ticker} →</Link>
        ) : (
          <span className="sub">→</span>
        )}
        <Link className="tool-link" href={`/compare?a=${entry.ticker}&b=${compareWith}`}>
          ⇄ 비교
        </Link>
      </nav>

      <main id="main">
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
                <div className="label">
                  반등 성공률 <Info k="wilson" />
                </div>
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
                <div className="label">
                  평균 MAE <Info k="mae" />
                </div>
                <div className="value warn">{pct(stats.avgMae)}</div>
                <div className="hint">진입 후 관찰 구간 최저</div>
              </div>
            </div>

            <section>
              <div className="sec-head">
                <h2>가격 + 진입 마커 + 거래량</h2>
                <nav className="range-nav" data-testid="range-nav" aria-label="기간">
                  {(Object.keys(RANGES) as RangeKey[]).map((k) => (
                    <Link
                      key={k}
                      href={`/t/${entry.ticker}?range=${k}${preset !== 'default' ? `&preset=${preset}` : ''}`}
                      aria-current={k === range ? 'page' : undefined}
                    >
                      {RANGES[k].label}
                    </Link>
                  ))}
                </nav>
                <span className="desc">
                  ● 성공 / ● 실패 — 마커에 마우스를 올리면 상세 · 프리셋 {PRESETS[preset].label}
                </span>
              </div>
              <PriceChart
                closes={vCloses}
                dates={vDates}
                volumes={vVolumes}
                markers={vEpisodes.map((e) => ({
                  index: e.entryIndex,
                  success: e.success,
                  date: vDates[e.entryIndex] ?? '',
                  reboundPct: e.reboundPct,
                }))}
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
                  <div className="label">
                    볼린저 %B <Info k="pctb" />
                  </div>
                  <div className="value">{stats.pctB === null ? '—' : stats.pctB.toFixed(2)}</div>
                </div>
                <div className="card">
                  <div className="label">
                    거래량 급증 <Info k="volsurge" />
                  </div>
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
                <span className="desc">전체 2년 기준(차트 기간과 무관)</span>
              </div>
              <div className="tablebox" data-testid="episode-table">
                <table>
                  <thead>
                    <tr>
                      <th>진입일</th>
                      <th>진입가</th>
                      <th>결과</th>
                      <th>최대 회복</th>
                      <th>
                        MAE <Info k="mae" />
                      </th>
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
                        <td className="num">
                          {e.daysToTarget === null ? '—' : `${e.daysToTarget}일`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
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
