// 픽스처 생성기 — 결정론 합성 시계열 (specs/001 R7, design.md 결정 3)
// 실행: node scripts/gen-fixtures.mjs  → src/lib/screener/fixtures.json 재생성
import { writeFileSync } from 'node:fs';

const lin = (from, to, n) =>
  Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));
const r2 = (xs) => xs.map((v) => Math.round(v * 100) / 100);

// FIXUP — 꾸준한 상승: 사례 0건, 하락 아님
const FIXUP = r2(Array.from({ length: 250 }, (_, i) => 100 * Math.pow(1.002, i)));

// FIXDN — 과거 반등 사례 2건(전부 성공) + 현재 하락 상태(미완결 꼬리)
const FIXDN = r2([
  ...lin(100, 129.5, 60), // 고점 129.5 형성
  125, 120, 116, 113.9, // -10% 하향 돌파(116에서 진입) → 저점
  118, 122, // 122/116 = +5.2% — 사례1 성공
  ...lin(124, 145, 30), // 신고가 145
  138, 132, 128, 126, // 128/145 = -11.7% 진입
  130, 134.5, // 134.5/128 = +5.1% — 사례2 성공
  ...lin(136, 155, 30), // 신고가 155
  148, 142, 136, 132, 131, // 131/155 = -15.5% — 진입 직후 꼬리(미완결, 표본 제외) + 현재 하락 중
]);

// FIXLEV — 레버리지: 사례 1건 실패(0%), 현재는 하락 아님
const FIXLEV = r2([
  ...lin(100, 139.5, 80), // 고점 139.5
  130, 122, // 122/139.5 = -12.5% 진입
  ...Array.from({ length: 25 }, (_, i) => 118 + (i % 3)), // 횡보 — 회복 실패
  ...lin(124, 135, 20), // 완만 회복(-3.2%) — 하락 상태 해제
]);

// SPY — 시장 레짐 판정용(002 R7): 완만한 상승 = "시장 정상"
const SPY = r2(Array.from({ length: 250 }, (_, i) => 480 * Math.pow(1.0012, i)));

const fixtures = {
  universe: [
    { ticker: 'FIXUP', name: '픽스처 상승주', category: '대형주', leveraged: false, note: '' },
    { ticker: 'FIXDN', name: '픽스처 하락주', category: '대형주', leveraged: false, note: '' },
    {
      ticker: 'FIXLEV',
      name: '픽스처 레버리지',
      category: '레버리지·인버스 ETF',
      leveraged: true,
      note: '3x',
    },
    { ticker: 'FIXBAD', name: '픽스처 조회실패', category: '대형주', leveraged: false, note: '' },
    { ticker: 'SPY', name: 'SPDR S&P 500(픽스처)', category: 'ETF 상위 100', leveraged: false, note: 'S&P 500' },
  ],
  series: { FIXUP, FIXDN, FIXLEV, SPY }, // FIXBAD 없음 → 조회 실패 경로(R4)
};

writeFileSync(
  new URL('../src/lib/screener/fixtures.json', import.meta.url),
  JSON.stringify(fixtures, null, 2) + '\n',
);
console.log('fixtures.json 재생성 완료');
