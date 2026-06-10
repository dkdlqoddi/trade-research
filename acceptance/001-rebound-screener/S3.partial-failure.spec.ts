import { test, expect } from '@playwright/test';

// S3 (covers: R4,R7): 조회 실패 픽스처 FIXBAD → 나머지 정상 렌더 + 실패 구분 표시
test('S3 일부 종목 조회가 실패해도 나머지 표는 렌더된다', async ({ page }) => {
  await page.goto('/');

  // 정상 종목 행 존재
  await expect(page.locator('tr', { hasText: 'FIXUP' }).first()).toBeVisible();

  // 실패 종목은 실패 표시와 함께 구분
  const badRow = page.locator('tr', { hasText: 'FIXBAD' }).first();
  await expect(badRow).toBeVisible();
  await expect(badRow).toContainText('조회 실패');
});
