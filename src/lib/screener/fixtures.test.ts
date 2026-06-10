import { describe, expect, it } from 'vitest';
import fixtures from './fixtures.json';
import { reboundStats, PARAMS } from './rebound';
import { trailingDrawdown } from './indicators';

// 픽스처 계약 — S2·S3 인수 테스트가 의존하는 통계 형태를 못 박는다.
// 생성기(scripts/gen-fixtures.mjs)를 바꾸면 이 테스트가 먼저 알려준다.
const series = fixtures.series as Record<string, number[]>;

describe('fixtures 계약', () => {
  it('FIXDN: 완결 사례 2건 전부 성공(100%) + 현재 하락 상태', () => {
    const closes = series.FIXDN;
    const s = reboundStats(closes);
    expect(s.episodes).toBe(2);
    expect(s.rebounds).toBe(2);
    expect(s.reboundRate).toBe(1);
    const dd = trailingDrawdown(closes, PARAMS.HIGH_WINDOW)!;
    expect(dd).toBeLessThanOrEqual(PARAMS.ENTRY_DD);
  });

  it('FIXUP: 사례 0건 + 하락 아님', () => {
    const closes = series.FIXUP;
    expect(reboundStats(closes).episodes).toBe(0);
    expect(trailingDrawdown(closes, PARAMS.HIGH_WINDOW)!).toBeGreaterThan(PARAMS.ENTRY_DD);
  });

  it('FIXLEV: 사례 1건 실패(0%) + 하락 아님', () => {
    const closes = series.FIXLEV;
    const s = reboundStats(closes);
    expect(s.episodes).toBe(1);
    expect(s.rebounds).toBe(0);
    expect(s.reboundRate).toBe(0);
    expect(trailingDrawdown(closes, PARAMS.HIGH_WINDOW)!).toBeGreaterThan(PARAMS.ENTRY_DD);
  });

  it('FIXBAD: 유니버스에 있으나 시세 없음(조회 실패 경로)', () => {
    expect(fixtures.universe.some((u) => u.ticker === 'FIXBAD')).toBe(true);
    expect(series.FIXBAD).toBeUndefined();
  });

  it('SPY: 레짐 판정용 — 하락 아님(시장 정상)', () => {
    expect(trailingDrawdown(series.SPY, PARAMS.HIGH_WINDOW)!).toBeGreaterThan(PARAMS.ENTRY_DD);
  });
});
