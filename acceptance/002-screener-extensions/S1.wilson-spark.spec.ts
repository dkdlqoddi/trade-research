import { test, expect } from '@playwright/test';

// S1 (covers: R1,R2,R9,R14): 윌슨 하한 표기 + 스파크라인 + 윌슨 정렬
test('S1 하락 구간에 윌슨 하한과 스파크라인이 보인다', async ({ page }) => {
  await page.goto('/');
  const decline = page.getByTestId('decline-section');

  const fixdn = decline.locator('tr', { hasText: 'FIXDN' });
  await expect(fixdn).toBeVisible();
  await expect(fixdn).toContainText('100%');
  await expect(fixdn).toContainText('하한 34%'); // 2/2 성공의 윌슨 95% 하한 ≈ 34%

  // R9: 스파크라인 SVG
  await expect(fixdn.locator('svg.spark')).toBeVisible();
});
