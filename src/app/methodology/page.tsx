import Link from 'next/link';
import { PRESETS } from '@/lib/screener/rebound';

export const metadata = { title: '방법론과 한계 — 반등 스크리너' };

// R12 — 정의·데이터 흐름·한계를 명시하는 정적 페이지
export default function Methodology() {
  return (
    <div className="wrap prose">
      <header className="masthead">
        <h1>방법론과 한계</h1>
        <span className="meta-chip">
          <Link href="/">← 대시보드</Link>
        </span>
      </header>

      <section id="definition">
        <h2>정의</h2>
        <p>
          <strong>하락 상태</strong> = 최근 60거래일 고점 대비 종가가 임계 낙폭 이상 낮은 상태.{' '}
          <strong>반등 사례</strong> = 낙폭이 임계를 하향 돌파한 날을 진입일로 보고, 관찰 기간 안에
          진입가 대비 목표 회복률에 도달하면 성공. <strong>반등 성공률</strong> = 성공 ÷ 전체 사례.
          정렬은 <strong>윌슨 점수 구간 95% 하한</strong> — 표본 2건 100%보다 표본 16건 94%가 위에
          온다.
        </p>
        <table>
          <thead>
            <tr>
              <th>프리셋</th>
              <th>진입 낙폭</th>
              <th>관찰 기간</th>
              <th>목표 회복</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(PRESETS).map((pr) => (
              <tr key={pr.label}>
                <td>{pr.label}</td>
                <td>{Math.round(pr.params.ENTRY_DD * 100)}%</td>
                <td>{pr.params.HORIZON}거래일</td>
                <td>+{Math.round(pr.params.TARGET * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          진입 후 관찰 기간이 남지 않은 미완결 사례는 표본에서 제외한다. MAE는 진입 후 관찰 구간
          최저 종가의 진입가 대비 비율 — &quot;반등 전에 얼마나 더 빠졌나&quot;.
        </p>
      </section>


      <section id="terms">
        <h2>용어</h2>
        <ul>
          <li id="wilson">
            <strong>윌슨 95% 하한</strong> — 성공률의 윌슨 점수 구간 하한(z=1.96). 표본이 작을수록
            성공률보다 크게 낮아져, 소표본 100%의 과대 노출을 막는 정렬 기준이다.
          </li>
          <li id="mae">
            <strong>MAE</strong> — 진입 후 관찰 구간 최저 종가의 진입가 대비 하락률. 반등을 기다리는
            동안 견뎌야 했던 최대 손실 깊이.
          </li>
          <li id="pctb">
            <strong>볼린저 %B</strong> — 20일 ±2σ 밴드 안에서의 상대 위치. 0이면 하단, 1이면 상단,
            밴드 밖이면 범위를 벗어난다.
          </li>
          <li id="volsurge">
            <strong>거래량 급증</strong> — 최근 5일 평균 거래량 ÷ 직전 60일 평균. 1보다 크면 평소보다
            거래가 몰린 상태(투매 또는 매집 — 방향은 말해주지 않는다).
          </li>
        </ul>
      </section>

      <section>
        <h2>데이터 흐름</h2>
        <p>
          유니버스는 <code>data/stock-universe.md</code>(주식 상위 200 + ETF 상위 100, 2026-06
          큐레이션) 한 곳에서 읽는다. 시세는 Yahoo Finance 비공식 엔드포인트에서 2년 일봉(adjusted
          close·거래량)을 수집해 <strong>SQLite</strong>에 저장하고, 24시간 안에는 재호출 없이 DB로
          응답한다. 분석 결과는 일일 스냅샷으로 남겨 &quot;오늘 신규 진입&quot;을 판정한다.
        </p>
      </section>

      <section>
        <h2>한계 — 읽지 않으면 표를 오독한다</h2>
        <ul>
          <li>
            <strong>생존 편향</strong>: 유니버스가 &quot;현재의&quot; 상위 300이다 — 살아남아 커진
            종목만 보므로 과거 반등 성공률이 구조적으로 후하게 나온다. 상장폐지·추락한 종목의 실패는
            표본에 없다.
          </li>
          <li>
            <strong>시장 레짐</strong>: 표본 대부분이 상승장에서 만들어졌다. 시장 전체가 하락
            국면(헤더 배지)일 때 개별 종목 반등률은 과대평가될 수 있다.
          </li>
          <li>
            <strong>변동성 잠식</strong>: 레버리지·인버스 ETF는 일일 수익률의 배수를 추적한다 —
            장기 보유 시 기초지수 배수와 괴리가 커지고, 반등 통계의 의미가 일반 종목과 다르다.
          </li>
          <li>
            <strong>비공식 데이터</strong>: Yahoo 비공식 엔드포인트라 결측·정정·티커 변경이
            가능하다. 조회 실패는 품질 패널에 격리 표시된다.
          </li>
          <li>
            <strong>과거 ≠ 미래</strong>: 이 표 전체가 과거 빈도다. 예측 모델이 아니며{' '}
            <strong>투자 조언이 아닙니다</strong>.
          </li>
        </ul>
      </section>
    </div>
  );
}
