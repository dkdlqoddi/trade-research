# acceptance/ — 인수 테스트 (BDD 바깥 루프)

스펙의 시나리오 S#와 **1:1 대응**하는 실행 가능한 인수 테스트를 둔다. `E2E_CMD`(`npx playwright test --retries=1 --grep-invert @quarantine`)로 실행된다.

## 규약

- 경로: `acceptance/<spec-id>-<slug>/S<번호>.<설명>.spec.ts` — 예: `acceptance/014-cart-merge/S1.login-merge.spec.ts`
- spec-lint가 S#마다 `acceptance/<id>*/S<번호>.*` 파일 존재를 검사한다.
- 테스트 제목에 `S<번호>`와 covers 주석을 남긴다.
- flaky 검역: 제목에 `@quarantine` 문자열을 붙이면 required 경로에서 제외되고 nightly에서만 돈다. 14일 내 수리 또는 삭제 (constitution).
- 비주얼 회귀(`toHaveScreenshot`)는 스냅샷을 로컬에서 먼저 생성·커밋한 뒤 CI에 올린다.

## 골격 예

```ts
import { test, expect } from '@playwright/test';

// S1 (covers: R1,R2): Given 게스트 장바구니에 상품 / When 로그인 / Then 병합된 장바구니
test('S1 게스트 장바구니가 로그인 시 병합된다', async ({ page }) => {
  // RED 단계에서 실패하는 상태로 시작한다
});
```
