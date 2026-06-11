import { test, expect } from '@playwright/test';

// S10 (covers: R12,R13): 방법론 페이지 + 품질 패널
test('S10 방법론 페이지와 품질 패널이 한계를 드러낸다', async ({ page }) => {
  await page.goto('/methodology');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('방법론');
  await expect(page.getByText('생존 편향')).toBeVisible();
  await expect(page.getByText('변동성 잠식')).toBeVisible();

  // 품질 패널: FIXBAD 오류 이력
  await page.goto('/');
  const panel = page.getByTestId('quality-panel');
  await panel.locator('summary').click();
  // error_log는 append-only(이력) — 같은 프로세스에서 여러 건 쌓일 수 있어 first로 존재 검증
  await expect(panel.getByText('FIXBAD').first()).toBeVisible();
});
