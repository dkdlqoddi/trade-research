// 통계 용어 → 방법론 앵커·짧은 설명 (003 R3)
export const TERMS = {
  wilson: {
    anchor: '/methodology#wilson',
    title: '윌슨 95% 하한 — 표본이 작을수록 성공률보다 크게 낮아지는 보수적 추정',
  },
  mae: {
    anchor: '/methodology#mae',
    title: 'MAE — 진입 후 관찰 구간 최저 종가의 진입가 대비 하락률',
  },
  pctb: {
    anchor: '/methodology#pctb',
    title: '볼린저 %B — 밴드 내 상대 위치(0=하단, 1=상단)',
  },
  volsurge: {
    anchor: '/methodology#volsurge',
    title: '거래량 급증 — 최근 5일 평균 ÷ 직전 60일 평균',
  },
  drawdown: {
    anchor: '/methodology#definition',
    title: '낙폭 — 최근 60거래일 고점 대비 하락률',
  },
} as const;
