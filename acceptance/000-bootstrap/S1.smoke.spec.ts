import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// S1 (covers: 부트스트랩 스모크): Given 앱 기동 / When 홈 접속 / Then 렌더 + axe serious 0건
test('S1 홈이 로드되고 접근성 serious 위반이 없다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? ''),
  );
  expect(serious).toEqual([]);
});
