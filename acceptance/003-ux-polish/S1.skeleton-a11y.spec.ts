import { test, expect } from '@playwright/test';

// S1 (covers: R1,R2,R13): 건너뛰기 링크 + 본문 로드 + 모바일 카드 레이아웃 (loading.tsx 존재는 빌드가 보장)
test('S1 건너뛰기 링크가 있고 본문이 로드된다', async ({ page }) => {
  await page.goto('/');
  const skip = page.locator('a.skip-link');
  await expect(skip).toHaveAttribute('href', '#main');
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.getByTestId('decline-section')).toBeVisible();
});

test('S1b 720px 미만에서 표가 카드형 행으로 바뀐다', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto('/');
  const td = page.getByTestId('decline-section').locator('tbody td').first();
  await expect(td).toBeVisible();
  const display = await td.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('block'); // R2: 카드형 전환
});
