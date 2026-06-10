import { test, expect } from '@playwright/test';

// S2 (covers: R3,R5): 하락 상태 픽스처 FIXDN(과거 사례 2건 전부 성공) → "지금 하락 중" 구간에 100%
test('S2 하락 중 종목이 반등 성공률과 함께 하락 구간에 나타난다', async ({ page }) => {
  await page.goto('/');

  const declineSection = page.getByTestId('decline-section');
  await expect(declineSection).toBeVisible();

  const fixdnRow = declineSection.locator('tr', { hasText: 'FIXDN' });
  await expect(fixdnRow).toBeVisible();
  await expect(fixdnRow).toContainText('100%');
});
