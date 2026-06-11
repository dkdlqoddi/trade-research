// 가격 차트 (002 R8 → 003 R8 강화) — 서버 순수 SVG, 의존성 0.
// 날짜 축 라벨(text.xaxis) · 거래량 서브차트(rect.vol, 하단 18%) · 진입 마커 <title>(네이티브 툴팁)
export type ChartMarker = {
  index: number;
  success: boolean;
  date: string;
  reboundPct: number;
};

export function PriceChart({
  closes,
  dates,
  volumes,
  markers,
}: {
  closes: number[];
  dates: string[];
  volumes: number[];
  markers: ChartMarker[];
}) {
  const W = 920;
  const H = 300;
  const PAD = 8;
  const VOL_H = Math.round(H * 0.18); // 거래량 서브차트 높이
  const PRICE_H = H - VOL_H - 18; // 가격 영역(하단 날짜 라벨 공간 제외)

  if (closes.length < 2) return <p className="empty">차트 데이터 없음.</p>;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const vmax = Math.max(...volumes, 1);
  const n = closes.length;

  const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
  const y = (c: number) => PAD + (1 - (c - min) / span) * (PRICE_H - PAD * 2);
  const pts = closes.map((c, i) => `${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(' ');

  // 날짜 축 — 5개 균등 라벨
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (n - 1)));
  const barW = Math.max((W - PAD * 2) / n - 0.5, 0.6);

  return (
    <svg
      className="chart"
      data-testid="price-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="가격 차트 — 진입 마커와 거래량 포함"
    >
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.6" />
      {markers.map((m) => (
        <circle
          key={m.index}
          cx={x(m.index)}
          cy={y(closes[m.index])}
          r="5"
          fill={m.success ? 'var(--up)' : 'var(--down)'}
          stroke="var(--bg)"
          strokeWidth="1.5"
        >
          <title>{`진입 ${m.date} · ${m.success ? '성공' : '실패'} · 최대 회복 ${(m.reboundPct * 100).toFixed(1)}%`}</title>
        </circle>
      ))}
      {/* 거래량 서브차트 */}
      {volumes.map((v, i) => {
        const h = (v / vmax) * (VOL_H - 4);
        return (
          <rect
            key={i}
            className="vol"
            x={(x(i) - barW / 2).toFixed(1)}
            y={(PRICE_H + (VOL_H - h)).toFixed(1)}
            width={barW.toFixed(1)}
            height={h.toFixed(1)}
          />
        );
      })}
      {/* 축 라벨 */}
      <text x={PAD} y={14} className="axis">
        {max.toFixed(2)}
      </text>
      <text x={PAD} y={PRICE_H - 4} className="axis">
        {min.toFixed(2)}
      </text>
      {ticks.map((i) => (
        <text
          key={i}
          className="xaxis"
          x={x(i).toFixed(1)}
          y={H - 4}
          textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
        >
          {dates[i] ?? ''}
        </text>
      ))}
    </svg>
  );
}
