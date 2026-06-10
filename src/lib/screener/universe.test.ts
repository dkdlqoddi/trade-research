import { describe, expect, it } from 'vitest';
import { parseUniverseMd } from './universe';

const SAMPLE = `# 유니버스

## 대형주

| 티커 | 이름 | 비고 |
|---|---|---|
| AAPL | Apple | |
| BRK-B | Berkshire Hathaway (Class B) | |

## 레버리지·인버스 ETF

경고 문단.

| 티커 | 이름 | 비고 |
|---|---|---|
| TQQQ | ProShares UltraPro QQQ | 나스닥100 3x |
`;

describe('parseUniverseMd', () => {
  it('R1: 표 행을 티커·이름·카테고리로 파싱한다', () => {
    const u = parseUniverseMd(SAMPLE);
    expect(u).toHaveLength(3);
    expect(u[0]).toMatchObject({ ticker: 'AAPL', name: 'Apple', category: '대형주' });
    expect(u[1].ticker).toBe('BRK-B');
  });

  it('레버리지 섹션의 종목은 leveraged=true', () => {
    const u = parseUniverseMd(SAMPLE);
    const tqqq = u.find((e) => e.ticker === 'TQQQ')!;
    expect(tqqq.leveraged).toBe(true);
    expect(tqqq.note).toBe('나스닥100 3x');
    expect(u.find((e) => e.ticker === 'AAPL')!.leveraged).toBe(false);
  });

  it('헤더 행과 구분선 행은 종목으로 세지 않는다', () => {
    const u = parseUniverseMd(SAMPLE);
    expect(u.some((e) => e.ticker === '티커' || e.ticker.startsWith('-'))).toBe(false);
  });
});
