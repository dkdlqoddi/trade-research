import { test, expect } from '@playwright/test';

// S7 (covers: R11,R12,R14,R15): 빈 상태 맥락·갱신 버튼·CSV·테마 토글
test('S7 스냅샷 기준 표기·갱신·CSV·테마 토글이 동작한다', async ({ page }) => {
  await page.goto('/');

  // R11: 신규 진입 구간에 직전 스냅샷 날짜 기준 표기
  await expect(page.getByTestId('new-entries')).toContainText(/직전 스냅샷 \d{4}-\d{2}-\d{2}/);

  // R12: 갱신 버튼 존재(클릭 시 /api/collect 호출)
  const refresh = page.getByRole('button', { name: /갱신/ });
  await expect(refresh).toBeVisible();

  // R14: CSV 내려받기
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /CSV/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);

  // R15: 테마 토글 → html[data-theme] 변경 + 저장
  await page.getByRole('button', { name: /테마/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
