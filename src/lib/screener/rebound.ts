// 반등 사례 추출·통계 — 순수 함수, IO 없음 (specs/001·002 핵심 정의)
// 백테스트 빈도 통계다 — 예측 모델이 아니다(R6 면책과 함께 읽을 것).
import { drawdownSeries } from './indicators';

export type ScreenParams = {
  HIGH_WINDOW: number;
  ENTRY_DD: number;
  HORIZON: number;
  TARGET: number;
  RSI_PERIOD: number;
  MIN_SAMPLES: number;
};

// 기본 파라미터 — 스펙 핵심 정의와 1:1, 조정은 /spec --revise (specs/001 [ASSUMED] 3)
export const PARAMS: ScreenParams = {
  HIGH_WINDOW: 60, // 고점 기준 거래일 창
  ENTRY_DD: -0.1, // 하락 상태 진입 임계 낙폭
  HORIZON: 20, // 반등 관찰 거래일
  TARGET: 0.05, // 반등 성공 기준 회복률
  RSI_PERIOD: 14,
  MIN_SAMPLES: 5, // 미만이면 "표본 부족" 라벨
};

// 프리셋 (002 R11) — 핵심 정의의 변형 3종
export const PRESETS = {
  conservative: {
    label: '보수',
    params: { ...PARAMS, ENTRY_DD: -0.15, HORIZON: 30 } as ScreenParams,
  },
  default: { label: '기본', params: PARAMS },
  aggressive: {
    label: '공격',
    params: { ...PARAMS, ENTRY_DD: -0.07, HORIZON: 10, TARGET: 0.03 } as ScreenParams,
  },
} as const;

export type PresetKey = keyof typeof PRESETS;

export type Episode = {
  entryIndex: number;
  entryClose: number;
  reboundPct: number; // HORIZON 내 최대 회복률
  success: boolean;
  mae: number; // HORIZON 내 최저 종가의 진입가 대비 비율 − 1 (002 R1)
  daysToTarget: number | null; // 목표 최초 도달 거래일 수, 실패면 null (002 R1)
};

// 진입 = drawdown이 ENTRY_DD를 하향 돌파한 날. HORIZON 미충족 꼬리(미완결)는 제외.
export function extractEpisodes(closes: number[], p: ScreenParams = PARAMS): Episode[] {
  const dd = drawdownSeries(closes, p.HIGH_WINDOW);
  const out: Episode[] = [];
  for (let i = 1; i < closes.length; i++) {
    const crossed = dd[i] <= p.ENTRY_DD && dd[i - 1] > p.ENTRY_DD;
    if (!crossed) continue;
    if (i + p.HORIZON >= closes.length) continue; // 미완결
    const entryClose = closes[i];
    const target = entryClose * (1 + p.TARGET);
    let high = -Infinity;
    let low = Infinity;
    let daysToTarget: number | null = null;
    for (let j = i + 1; j <= i + p.HORIZON; j++) {
      if (closes[j] > high) high = closes[j];
      if (closes[j] < low) low = closes[j];
      if (daysToTarget === null && closes[j] >= target) daysToTarget = j - i;
    }
    out.push({
      entryIndex: i,
      entryClose,
      reboundPct: high / entryClose - 1,
      success: daysToTarget !== null,
      mae: low / entryClose - 1,
      daysToTarget,
    });
  }
  return out;
}

// 윌슨 점수 구간 하한 (95%, z=1.96) — 소표본 성공률의 보수적 추정 (002 R14)
export function wilsonLow(successes: number, n: number, z = 1.96): number | null {
  if (n <= 0) return null;
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const radius = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return Math.max(0, (center - radius) / denom);
}

export type ReboundStats = {
  episodes: number;
  rebounds: number;
  reboundRate: number | null;
  avgReboundPct: number | null;
  wilsonLow: number | null; // 002
  avgRecoveryDays: number | null; // 002 — 성공 사례 평균
  avgMae: number | null; // 002 — 전체 사례 평균
};

export function reboundStats(closes: number[], p: ScreenParams = PARAMS): ReboundStats {
  const eps = extractEpisodes(closes, p);
  if (eps.length === 0) {
    return {
      episodes: 0,
      rebounds: 0,
      reboundRate: null,
      avgReboundPct: null,
      wilsonLow: null,
      avgRecoveryDays: null,
      avgMae: null,
    };
  }
  const wins = eps.filter((e) => e.success);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    episodes: eps.length,
    rebounds: wins.length,
    reboundRate: wins.length / eps.length,
    avgReboundPct: avg(eps.map((e) => e.reboundPct)),
    wilsonLow: wilsonLow(wins.length, eps.length),
    avgRecoveryDays: wins.length > 0 ? avg(wins.map((e) => e.daysToTarget!)) : null,
    avgMae: avg(eps.map((e) => e.mae)),
  };
}
