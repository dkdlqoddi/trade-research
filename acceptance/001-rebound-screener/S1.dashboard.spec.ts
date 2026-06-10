import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// S1 (covers: R1,R2,R6): 픽스처 환경에서 대시보드 접속 → 표 + 면책 + 레버리지 경고 + axe serious 0
// 실행: DATA_SOURCE=fixture npx playwright test acceptance/001-rebound-screener
test('S1 대시보드가 통계 표와 면책 문구를 보여준다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('반등 스크리너');

  // 통계 표 — 데이터 행 1개 이상
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible();

  // R6: 면책 + 레버리지 경고
  await expect(page.getByText('투자 조언이 아닙니다')).toBeVisible();
  await expect(page.getByText('변동성 잠식')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? ''),
  );
  expect(serious).toEqual([]);
});
