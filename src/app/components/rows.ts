// 표 공유 행 타입 — 페이지(서버)가 1회 직렬화해 모든 표 컴포넌트에 전달 (003 design 결정 1)
export type ScreenRow = {
  ticker: string;
  name: string;
  category: string;
  leveraged: boolean;
  note: string;
  lastClose: number | null;
  drawdown: number | null;
  rsi14: number | null;
  episodes: number;
  rebounds: number;
  reboundRate: number | null;
  wilsonLow: number | null;
  avgReboundPct: number | null;
  inDecline: boolean;
  isNewEntry: boolean;
  declineStart: string | null; // 현재 하락 구간 시작일(R5)
  closes60: number[];
  error: string | null;
};

export const fmt = {
  pct: (v: number | null, d = 1) => (v === null ? '—' : `${(v * 100).toFixed(d)}%`),
  rate: (v: number | null) => (v === null ? 'N/A' : `${Math.round(v * 100)}%`),
  num: (v: number | null, d = 0) => (v === null ? '—' : v.toFixed(d)),
};
