import { test, expect } from '@playwright/test';

// S5 (covers: R8): 차트 강화 — 기간 선택·날짜 축·거래량·마커 설명
test('S5 상세 차트에 날짜 축·거래량·마커 설명이 있다', async ({ page }) => {
  await page.goto('/t/FIXDN?range=1y');

  const chart = page.getByTestId('price-chart');
  await expect(chart).toBeVisible();
  await expect(chart.locator('text.xaxis').first()).toBeVisible(); // 날짜 축 라벨
  await expect(chart.locator('rect.vol').first()).toBeVisible(); // 거래량 서브차트
  await expect(chart.locator('circle title').first()).toHaveText(/진입/); // 마커 설명

  // 기간 선택 링크
  const rangeNav = page.getByTestId('range-nav');
  await expect(rangeNav.getByRole('link', { name: '6M' })).toBeVisible();
  await rangeNav.getByRole('link', { name: '2Y' }).click();
  await expect(page).toHaveURL(/range=2y/);
});
