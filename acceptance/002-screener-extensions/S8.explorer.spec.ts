import { test, expect } from '@playwright/test';

// S8 (covers: R10): 탐색 표 — 검색 필터 + 관심목록 localStorage 유지
test('S8 검색 필터가 동작하고 관심 토글이 새로고침을 견딘다', async ({ page }) => {
  await page.goto('/');
  const explorer = page.getByTestId('explorer');

  // 검색: FIXUP만 남는다
  await explorer.getByRole('searchbox').fill('FIXUP');
  await expect(explorer.locator('tbody tr', { hasText: 'FIXUP' })).toBeVisible();
  await expect(explorer.locator('tbody tr', { hasText: 'FIXLEV' })).toHaveCount(0);

  // 관심 토글 → 새로고침 후 유지 (localStorage)
  await explorer.getByRole('searchbox').fill('');
  const star = explorer.locator('tr', { hasText: 'FIXUP' }).getByRole('button').first();
  await star.click();
  await page.reload();
  const starAfter = page
    .getByTestId('explorer')
    .locator('tr', { hasText: 'FIXUP' })
    .getByRole('button')
    .first();
  await expect(starAfter).toHaveAttribute('aria-pressed', 'true');
});
