import { test, expect } from '@playwright/test';

// S6 (covers: R4,R5,R7): 신규 진입 구간(직전 스냅샷 대비) + 시장 레짐 배지
test('S6 신규 진입 구간과 레짐 배지가 보인다', async ({ page }) => {
  await page.goto('/');

  // 픽스처: 어제 스냅샷에 FIXDN=하락 아님 시드 → 오늘 신규 진입
  const newSec = page.getByTestId('new-entries');
  await expect(newSec).toBeVisible();
  await expect(newSec.locator('tr', { hasText: 'FIXDN' })).toBeVisible();

  // 픽스처 SPY는 상승 시계열 → "시장 정상" 배지
  const regime = page.getByTestId('regime-chip');
  await expect(regime).toBeVisible();
  await expect(regime).toContainText('시장');
});
