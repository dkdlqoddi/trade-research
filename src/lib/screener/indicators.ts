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
