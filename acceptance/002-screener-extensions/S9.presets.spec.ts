import { test, expect } from '@playwright/test';

// S9 (covers: R11): 프리셋 전환 — 공격(−7%/10일/+3%)으로 재계산
test('S9 공격 프리셋으로 전환하면 파라미터가 반영된다', async ({ page }) => {
  await page.goto('/');

  const nav = page.getByTestId('preset-nav');
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: '공격' }).click();

  await expect(page).toHaveURL(/preset=aggressive/);
  // 파라미터 설명줄이 공격 프리셋 수치로 갱신된다
  await expect(page.getByText('7%', { exact: false }).first()).toBeVisible();
  await expect(page.getByTestId('decline-section')).toBeVisible();
});
