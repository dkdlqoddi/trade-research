// 반등 사례 추출·통계 — 순수 함수, IO 없음 (specs/001 핵심 정의)
// 백테스트 빈도 통계다 — 예측 모델이 아니다(R6 면책과 함께 읽을 것).
import { drawdownSeries } from './indicators';

// 파라미터는 스펙의 핵심 정의와 1:1 — 조정은 /spec --revise (specs/001 [ASSUMED] 3)
export const PARAMS = {
  HIGH_WINDOW: 60, // 고점 기준 거래일 창
  ENTRY_DD: -0.1, // 하락 상태 진입 임계 낙폭
  HORIZON: 20, // 반등 관찰 거래일
  TARGET: 0.05, // 반등 성공 기준 회복률
  RSI_PERIOD: 14,
  MIN_SAMPLES: 5, // 미만이면 "표본 부족" 라벨
} as const;

export type Episode = {
  entryIndex: number;
  entryClose: number;
  reboundPct: number; // HORIZON 내 최대 회복률
  success: boolean;
};

// 진입 = drawdown이 ENTRY_DD를 하향 돌파한 날. HORIZON 미충족 꼬리(미완결)는 제외.
export function extractEpisodes(closes: number[]): Episode[] {
  const dd = drawdownSeries(closes, PARAMS.HIGH_WINDOW);
  const out: Episode[] = [];
  for (let i = 1; i < closes.length; i++) {
    const crossed = dd[i] <= PARAMS.ENTRY_DD && dd[i - 1] > PARAMS.ENTRY_DD;
    if (!crossed) continue;
    if (i + PARAMS.HORIZON >= closes.length) continue; // 미완결
    const entryClose = closes[i];
    let high = -Infinity;
    for (let j = i + 1; j <= i + PARAMS.HORIZON; j++) {
      if (closes[j] > high) high = closes[j];
    }
    const reboundPct = high / entryClose - 1;
    out.push({ entryIndex: i, entryClose, reboundPct, success: reboundPct >= PARAMS.TARGET });
  }
  return out;
}

export type ReboundStats = {
  episodes: number;
  rebounds: number;
  reboundRate: number | null;
  avgReboundPct: number | null;
};

export function reboundStats(closes: number[]): ReboundStats {
  const eps = extractEpisodes(closes);
  if (eps.length === 0) {
    return { episodes: 0, rebounds: 0, reboundRate: null, avgReboundPct: null };
  }
  const rebounds = eps.filter((e) => e.success).length;
  const avg = eps.reduce((s, e) => s + e.reboundPct, 0) / eps.length;
  return {
    episodes: eps.length,
    rebounds,
    reboundRate: rebounds / eps.length,
    avgReboundPct: avg,
  };
}
