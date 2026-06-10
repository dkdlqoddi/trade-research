import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { extractEpisodes, reboundStats, wilsonLow, PARAMS, PRESETS } from './rebound';

// 60일 고점 100 형성 후 89로 하향 돌파 → 진입. 이후 시나리오를 덧붙이는 헬퍼.
function seriesWithEntry(tail: number[]): number[] {
  const rise = Array.from({ length: 20 }, (_, i) => 81 + i); // 81..100
  return [...rise, 89, ...tail]; // 89/100 = -11% → 진입
}

describe('extractEpisodes', () => {
  it('하향 돌파일을 진입으로 잡고, 20일 내 +5% 회복이면 성공', () => {
    // 진입가 89, 목표 89*1.05 = 93.45 → 94 도달 = 성공
    const closes = seriesWithEntry([90, 91, 94, ...Array(17).fill(92)]);
    const eps = extractEpisodes(closes);
    expect(eps).toHaveLength(1);
    expect(eps[0].success).toBe(true);
    expect(eps[0].reboundPct).toBeCloseTo(94 / 89 - 1, 10);
  });

  it('20일 내 목표 미달이면 실패 사례', () => {
    const closes = seriesWithEntry(Array(20).fill(90)); // 최대 90 < 93.45
    const eps = extractEpisodes(closes);
    expect(eps).toHaveLength(1);
    expect(eps[0].success).toBe(false);
  });

  it('HORIZON이 안 남은 꼬리 진입(미완결)은 표본에서 제외한다', () => {
    const closes = seriesWithEntry([90, 91]); // 진입 후 2일뿐
    expect(extractEpisodes(closes)).toHaveLength(0);
  });

  it('-10% 아래 머무는 동안은 재진입으로 세지 않는다', () => {
    // 진입 후 회복 없이 계속 하락 → 사례 1건뿐
    const closes = seriesWithEntry(Array.from({ length: 25 }, (_, i) => 88 - i * 0.5));
    expect(extractEpisodes(closes)).toHaveLength(1);
  });
});

describe('reboundStats', () => {
  it('성공률 = 성공/전체, 평균 회복폭 계산', () => {
    const closes = [
      ...seriesWithEntry([90, 91, 94, ...Array(17).fill(92)]), // 성공 (92 < 100*0.9 → 계속 하락 상태 유지)
      ...Array.from({ length: 30 }, (_, i) => 96 + i), // 회복 후 신고가 재형성 (96..125)
      ...Array.from({ length: 21 }, () => 110), // 125 고점 대비 110 = -12% → 2번째 진입, 110 유지 = 실패
    ];
    const s = reboundStats(closes);
    expect(s.episodes).toBe(2);
    expect(s.rebounds).toBe(1);
    expect(s.reboundRate).toBeCloseTo(0.5, 10);
  });

  it('사례 0건이면 reboundRate는 null', () => {
    const closes = Array.from({ length: 100 }, (_, i) => 100 + i);
    const s = reboundStats(closes);
    expect(s.episodes).toBe(0);
    expect(s.reboundRate).toBeNull();
  });

  // R5 (Invariant): 성공률은 입력과 무관하게 null 또는 [0, 1] — 속성 테스트
  it('R5: 임의 양수 시계열에서 성공률 ∈ [0,1] ∪ null', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.5, max: 5000, noNaN: true }), {
          minLength: 2,
          maxLength: 400,
        }),
        (closes) => {
          const s = reboundStats(closes);
          if (s.reboundRate === null) {
            expect(s.episodes).toBe(0);
          } else {
            expect(s.reboundRate).toBeGreaterThanOrEqual(0);
            expect(s.reboundRate).toBeLessThanOrEqual(1);
            expect(s.rebounds).toBeLessThanOrEqual(s.episodes);
          }
        },
      ),
    );
  });

  it('PARAMS가 스펙의 핵심 정의와 일치한다', () => {
    expect(PARAMS).toMatchObject({
      HIGH_WINDOW: 60,
      ENTRY_DD: -0.1,
      HORIZON: 20,
      TARGET: 0.05,
      RSI_PERIOD: 14,
    });
  });
});

// ── 002 확장 ──

describe('wilsonLow (R14)', () => {
  it('2/2 성공의 95% 하한 ≈ 0.342', () => {
    expect(wilsonLow(2, 2)!).toBeCloseTo(0.3424, 3);
  });

  it('표본 0이면 null', () => {
    expect(wilsonLow(0, 0)).toBeNull();
  });

  it('표본이 클수록 하한이 성공률에 접근한다', () => {
    expect(wilsonLow(90, 100)!).toBeGreaterThan(wilsonLow(9, 10)!);
  });

  // R14 (Invariant): 0 ≤ 하한 ≤ 성공률
  it('R14: 임의 표본에서 0 ≤ 하한 ≤ p', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 500 }), fc.integer({ min: 0, max: 500 }), (n, kRaw) => {
        const k = Math.min(kRaw, n);
        const low = wilsonLow(k, n)!;
        expect(low).toBeGreaterThanOrEqual(0);
        expect(low).toBeLessThanOrEqual(k / n + 1e-12);
      }),
    );
  });
});

describe('회복 소요일·MAE (R1)', () => {
  it('성공 사례 — daysToTarget=목표 최초 도달 거래일, mae=관찰 구간 최저/진입가', () => {
    // 진입 89, 이후 90, 91, 94(3일째 목표 93.45 도달), 92×17
    const closes = seriesWithEntry([90, 91, 94, ...Array(17).fill(92)]);
    const [ep] = extractEpisodes(closes);
    expect(ep.daysToTarget).toBe(3);
    expect(ep.mae).toBeCloseTo(90 / 89 - 1, 10); // 구간 최저 90
  });

  it('실패 사례 — daysToTarget은 null, mae는 최저 반영', () => {
    const closes = seriesWithEntry([88, 85, ...Array(18).fill(87)]);
    const [ep] = extractEpisodes(closes);
    expect(ep.success).toBe(false);
    expect(ep.daysToTarget).toBeNull();
    expect(ep.mae).toBeCloseTo(85 / 89 - 1, 10);
  });

  it('reboundStats가 평균 회복 소요일(성공만)·평균 MAE(전체)·윌슨 하한을 준다', () => {
    const closes = seriesWithEntry([90, 91, 94, ...Array(17).fill(92)]);
    const s = reboundStats(closes);
    expect(s.avgRecoveryDays).toBe(3);
    expect(s.avgMae).toBeCloseTo(90 / 89 - 1, 10);
    expect(s.wilsonLow).toBeCloseTo(wilsonLow(1, 1)!, 10);
  });
});

describe('프리셋 파라미터화 (R11)', () => {
  it('공격 프리셋(−7%)은 기본(−10%)이 놓치는 얕은 하락을 진입으로 잡는다', () => {
    // 고점 100 형성 후 92(−8%)로 하락 → 기본 미진입, 공격 진입
    const closes = [...Array.from({ length: 30 }, (_, i) => 71 + i), 92, ...Array(25).fill(93)];
    expect(extractEpisodes(closes, PARAMS)).toHaveLength(0);
    expect(extractEpisodes(closes, PRESETS.aggressive.params)).toHaveLength(1);
  });

  it('PRESETS 구성 — 보수/기본/공격', () => {
    expect(PRESETS.conservative.params).toMatchObject({ ENTRY_DD: -0.15, HORIZON: 30 });
    expect(PRESETS.default.params).toEqual(PARAMS);
    expect(PRESETS.aggressive.params).toMatchObject({
      ENTRY_DD: -0.07,
      HORIZON: 10,
      TARGET: 0.03,
    });
  });
});
