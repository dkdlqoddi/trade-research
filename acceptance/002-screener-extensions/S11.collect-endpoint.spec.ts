import { test, expect } from '@playwright/test';

// S11 (covers: R6): 수집 엔드포인트 계약 — 200 + collected+failed = 유니버스 크기
// 전제: 테스트 환경은 CRON_SECRET 미설정(설정 시 401 — 인증 경로는 route의 safeEqual이 담당)
test('S11 GET /api/collect가 요약 JSON을 반환한다', async ({ request }) => {
  const res = await request.get('/api/collect?force=1');
  expect(res.status()).toBe(200);

  const body = (await res.json()) as {
    ok: boolean;
    collected: number;
    failed: number;
    durationMs: number;
  };
  expect(body.ok).toBe(true);
  // 픽스처 유니버스 = 5종목(FIXUP, FIXDN, FIXLEV, FIXBAD, SPY)
  expect(body.collected + body.failed).toBe(5);
  expect(body.failed).toBeGreaterThanOrEqual(1); // FIXBAD
  expect(typeof body.durationMs).toBe('number');
});
