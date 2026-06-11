import { test, expect } from '@playwright/test';

// S6 (covers: R9,R10): 이웃 탐색 + 비교 뷰
test('S6 비교 뷰가 두 종목을 나란히 보여준다', async ({ page }) => {
  await page.goto('/compare?a=FIXDN&b=FIXUP');
  await expect(page.getByTestId('compare-a')).toContainText('FIXDN');
  await expect(page.getByTestId('compare-b')).toContainText('FIXUP');
  await expect(page.getByTestId('compare-a').locator('svg')).toBeVisible();
});

test('S6b 상세 페이지에 이웃 탐색 링크가 있다', async ({ page }) => {
  // 픽스처에서 하락 구간은 FIXDN 1종목 — 이웃 링크 컨테이너와 비교 링크 존재를 검증
  await page.goto('/t/FIXDN');
  const nav = page.getByTestId('neighbor-nav');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: /비교/ })).toBeVisible();
});
