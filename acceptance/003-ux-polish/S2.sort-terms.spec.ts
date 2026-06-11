import { test, expect } from '@playwright/test';

// S2 (covers: R7,R3): 하락 표 정렬 + aria-sort + 용어 도움 링크
test('S2 하락 표 머리글 정렬과 용어 링크가 동작한다', async ({ page }) => {
  await page.goto('/');
  const decline = page.getByTestId('decline-section');

  // R3: 용어 도움 링크 → methodology 앵커
  const info = decline.locator('a.info').first();
  await expect(info).toHaveAttribute('href', /\/methodology#/);

  // R7+R13: RSI 머리글 클릭 → aria-sort 변경
  const rsiTh = decline.locator('th', { hasText: 'RSI' });
  await expect(rsiTh).toHaveAttribute('aria-sort', 'none');
  await rsiTh.getByRole('button').click();
  await expect(rsiTh).toHaveAttribute('aria-sort', 'descending');
  await rsiTh.getByRole('button').click();
  await expect(rsiTh).toHaveAttribute('aria-sort', 'ascending');
});
