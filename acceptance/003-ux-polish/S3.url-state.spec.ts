import { test, expect } from '@playwright/test';

// S3 (covers: R4): 탐색 상태 URL 유지
test('S3 검색 상태가 URL에 반영되고 새로고침을 견딘다', async ({ page }) => {
  await page.goto('/');
  const explorer = page.getByTestId('explorer');

  await explorer.getByRole('searchbox').fill('FIXUP');
  await expect(page).toHaveURL(/q=FIXUP/);

  await page.reload();
  const after = page.getByTestId('explorer');
  await expect(after.getByRole('searchbox')).toHaveValue('FIXUP');
  await expect(after.locator('tbody tr', { hasText: 'FIXUP' })).toBeVisible();
  await expect(after.locator('tbody tr', { hasText: 'FIXLEV' })).toHaveCount(0);
});
