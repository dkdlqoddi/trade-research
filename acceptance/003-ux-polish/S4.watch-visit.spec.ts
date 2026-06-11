import { test, expect } from '@playwright/test';

// S4 (covers: R5,R6): 관심 구간 상단 고정 + 방문 이후 진입 배지
test('S4 관심 구간과 방문 후 진입 배지가 보인다', async ({ page }) => {
  // 과거 방문·관심 등록을 시드 — FIXDN은 픽스처상 오늘 진입이므로 "방문 후 진입" 대상
  await page.addInitScript(() => {
    localStorage.setItem('watchlist', JSON.stringify(['FIXDN']));
    localStorage.setItem('lastVisit', '2020-01-01T00:00:00.000Z');
  });
  await page.goto('/');

  const watch = page.getByTestId('watch-section');
  await expect(watch).toBeVisible();
  await expect(watch.locator('tr', { hasText: 'FIXDN' })).toBeVisible();

  // R5: 방문 이후 진입 배지 (하락 구간 행)
  const decline = page.getByTestId('decline-section');
  await expect(decline.locator('tr', { hasText: 'FIXDN' }).getByText('방문 후 진입')).toBeVisible();
});
