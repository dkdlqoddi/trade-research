import { test, expect } from '@playwright/test';

// S7 (covers: R3,R8): 종목 상세 — 차트 + 진입 마커 + 사례 표 + 보조지표
test('S7 상세 페이지에 차트·사례 표·보조지표가 보인다', async ({ page }) => {
  await page.goto('/t/FIXDN');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('FIXDN');
  await expect(page.getByTestId('price-chart')).toBeVisible();
  await expect(page.getByTestId('price-chart').locator('circle').first()).toBeVisible(); // 진입 마커

  // 사례 표: 완결 사례 2행
  const rows = page.getByTestId('episode-table').locator('tbody tr');
  await expect(rows).toHaveCount(2);

  // R3 보조지표 카드
  await expect(page.getByText('MA50 이격')).toBeVisible();
  await expect(page.getByText('볼린저 %B')).toBeVisible();
  await expect(page.getByText('거래량 급증')).toBeVisible();
});
