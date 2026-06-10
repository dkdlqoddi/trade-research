import { test, expect } from '@playwright/test';

// S4 (covers: R8,R9): SQLite 저장 + 수집 시각 표시.
// "두 번째 조회는 원천 호출 없음"의 행위 검증은 단위 테스트(db.test.ts·marketdata 캐시 경로)가 담당하고,
// e2e는 사용자 관점 증거(수집 시각 노출)를 검증한다.
test('S4 데이터 수집 시각이 페이지에 표시된다', async ({ page }) => {
  await page.goto('/');
  const meta = page.getByTestId('meta-fetched');
  await expect(meta).toBeVisible();
  // ISO 날짜 조각(YYYY-MM-DD)이 들어 있어야 한다
  await expect(meta).toContainText(/\d{4}-\d{2}-\d{2}/);
});
