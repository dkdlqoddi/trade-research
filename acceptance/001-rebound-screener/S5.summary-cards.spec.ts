import { test, expect } from '@playwright/test';

// S5 (covers: R10,R11): 요약 카드 — 유니버스 구성·하락 수·실패 수·수집 시각
test('S5 요약 카드가 표 상단에 나타난다', async ({ page }) => {
  await page.goto('/');
  const cards = page.getByTestId('summary-cards');
  await expect(cards).toBeVisible();

  await expect(cards.getByText('유니버스')).toBeVisible();
  await expect(cards.getByText('지금 하락 중')).toBeVisible();
  await expect(cards.getByText('조회 실패')).toBeVisible();
  await expect(cards.getByText('반등 성공률')).toBeVisible();
});
