// 60일 스파크라인(R9) — 의존성 0 서버/클라이언트 겸용 SVG. 수치는 표의 텍스트가 담당(장식, aria-hidden).
export function Spark({ closes }: { closes: number[] }) {
  if (closes.length < 2) return null;
  const w = 110;
  const h = 26;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const n = closes.length;
  const pts = closes
    .map((c, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - 2 - ((c - min) / span) * (h - 4)).toFixed(1)}`)
    .join(' ');
  const up = closes[n - 1] >= closes[0];
  return (
    <svg
      className={`spark ${up ? 'up' : 'down'}`}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
    >
      <polyline points={pts} fill="none" strokeWidth="1.5" stroke="currentColor" />
    </svg>
  );
}
