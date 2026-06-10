import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { rsi14, trailingDrawdown, drawdownSeries } from './indicators';

describe('rsi14', () => {
  it('R5: 연속 상승이면 RSI 100', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    expect(rsi14(closes)).toBe(100);
  });

  it('R5: 연속 하락이면 RSI 0', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 - i * 2);
    expect(rsi14(closes)).toBe(0);
  });

  it('R5: 데이터가 15개 미만이면 null', () => {
    expect(rsi14([1, 2, 3])).toBeNull();
  });

  // R5 (Invariant): RSI는 입력과 무관하게 [0, 100] — 속성 테스트
  it('R5: 임의 양수 시계열에서 RSI ∈ [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.01, max: 10000, noNaN: true }), {
          minLength: 15,
          maxLength: 300,
        }),
        (closes) => {
          const v = rsi14(closes);
          expect(v).not.toBeNull();
          expect(v!).toBeGreaterThanOrEqual(0);
          expect(v!).toBeLessThanOrEqual(100);
        },
      ),
    );
  });
});

describe('drawdown', () => {
  it('60일 고점 대비 현재 낙폭을 계산한다', () => {
    // 100까지 오른 뒤 85로 하락 → -15%
    const closes = [...Array.from({ length: 30 }, (_, i) => 71 + i), 85];
    expect(trailingDrawdown(closes, 60)).toBeCloseTo(85 / 100 - 1, 10);
  });

  it('신고가면 낙폭 0', () => {
    const closes = Array.from({ length: 70 }, (_, i) => 100 + i);
    expect(trailingDrawdown(closes, 60)).toBe(0);
  });

  it('drawdownSeries는 각 시점의 창 내 고점 기준 낙폭을 준다', () => {
    const closes = [100, 110, 99];
    // i=0: 100/100-1=0, i=1: 110/110-1=0, i=2: 99/110-1=-0.1
    expect(drawdownSeries(closes, 60)).toEqual([0, 0, 99 / 110 - 1]);
  });
});
