// 순수 지표 함수 — IO 없음 (specs/001 R5)

// RSI(period, Wilder smoothing). 데이터 부족 시 null.
export function rsi14(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }

  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// 시점 i의 낙폭: 최근 window개(가용분) 고점 대비 비율 − 1
export function drawdownAt(closes: number[], i: number, window: number): number {
  const start = Math.max(0, i - window + 1);
  let high = -Infinity;
  for (let j = start; j <= i; j++) if (closes[j] > high) high = closes[j];
  return closes[i] / high - 1;
}

export function drawdownSeries(closes: number[], window: number): number[] {
  return closes.map((_, i) => drawdownAt(closes, i, window));
}

export function trailingDrawdown(closes: number[], window: number): number | null {
  if (closes.length === 0) return null;
  return drawdownAt(closes, closes.length - 1, window);
}

// ── 002 보조지표 (R3) ──

export function sma(values: number[], n: number): number | null {
  if (values.length < n || n <= 0) return null;
  let s = 0;
  for (let i = values.length - n; i < values.length; i++) s += values[i];
  return s / n;
}

// 마지막 종가의 n일 이평 대비 이격률
export function maDistance(closes: number[], n: number): number | null {
  const m = sma(closes, n);
  if (m === null || m === 0) return null;
  return closes[closes.length - 1] / m - 1;
}

// 볼린저 %B (n일, k 표준편차) — 표준편차 0(무변동)이면 null
export function bollingerPctB(closes: number[], n = 20, k = 2): number | null {
  if (closes.length < n) return null;
  const win = closes.slice(-n);
  const m = win.reduce((a, b) => a + b, 0) / n;
  const variance = win.reduce((a, b) => a + (b - m) * (b - m), 0) / n;
  const sd = Math.sqrt(variance);
  if (sd === 0) return null;
  const last = closes[closes.length - 1];
  return (last - (m - k * sd)) / (2 * k * sd);
}

// 거래량 급증율 — 최근 short일 평균 / 직전 long일(최근 short 제외) 평균
export function volumeSurge(volumes: number[], short = 5, long = 60): number | null {
  if (volumes.length < short + long) return null;
  const recent = volumes.slice(-short);
  const base = volumes.slice(-(short + long), -short);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / short;
  const avgBase = base.reduce((a, b) => a + b, 0) / long;
  if (avgBase === 0) return null;
  return avgRecent / avgBase;
}
