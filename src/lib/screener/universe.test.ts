import { describe, expect, it } from 'vitest';
import { parseUniverseMd } from './universe';

const SAMPLE = `# 유니버스

## 주식 상위 200

| 티커 | 이름 | 비고 |
|---|---|---|
| AAPL | Apple | |
| BRK-B | Berkshire Hathaway (Class B) | |

## ETF 상위 100

경고 문단.

| 티커 | 이름 | 비고 |
|---|---|---|
| SPY | SPDR S&P 500 | S&P 500 |
| TQQQ | ProShares UltraPro QQQ | 나스닥100 3x |
| SQQQ | ProShares UltraPro Short QQQ | 나스닥100 -3x |
`;

describe('parseUniverseMd', () => {
  it('R1: 표 행을 티커·이름·카테고리로 파싱한다', () => {
    const u = parseUniverseMd(SAMPLE);
    expect(u).toHaveLength(5);
    expect(u[0]).toMatchObject({ ticker: 'AAPL', name: 'Apple', category: '주식 상위 200' });
    expect(u[1].ticker).toBe('BRK-B');
  });

  it('R10: 레버리지 여부는 비고의 배율 표기(3x, -3x, 레버리지, 인버스)로 판별한다', () => {
    const u = parseUniverseMd(SAMPLE);
    expect(u.find((e) => e.ticker === 'TQQQ')!.leveraged).toBe(true);
    expect(u.find((e) => e.ticker === 'SQQQ')!.leveraged).toBe(true);
    expect(u.find((e) => e.ticker === 'SPY')!.leveraged).toBe(false); // 'S&P 500'은 배율 아님
    expect(u.find((e) => e.ticker === 'AAPL')!.leveraged).toBe(false);
  });

  it('헤더 행과 구분선 행은 종목으로 세지 않는다', () => {
    const u = parseUniverseMd(SAMPLE);
    expect(u.some((e) => e.ticker === '티커' || e.ticker.startsWith('-'))).toBe(false);
  });
});
