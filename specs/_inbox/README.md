# specs/_inbox/ — 기계 피드백 수집함

**기계 산출 전용**(constitution §12): ops-review 결과·flaky 기록만 여기에 쌓인다.
사람의 기능·버그·개선 의도는 **GitHub Issue**(Issue Forms — `[FEAT]`/`[BUG]`/`[CHORE]`/`[REFACTOR]`/`[SPIKE]`)로 등록한다. 솔로·스파이크 예외만 터미널 `/spec <설명>` 직행(`issue: null`). `[SEC]` 취약점은 이슈 금지 — private vulnerability reporting 접수 후 터미널 `/spec` 직행(ADR 0003).

## 파일 규격

경로: `specs/_inbox/<kind>-<주제>.md` (예: `ops-2026-06-11-checkout-errors.md`, `flaky-S3-checkout.md`)

파일 머리(필수):

```yaml
kind: ops | flaky
by: "@깃헙핸들 또는 생성 주체(/ops-review 등)"
date: 2026-06-11
```

본문:

- **ops**: 관측 데이터 출처와 신호(에러 클러스터, 퍼널 이상) — `/ops-review`가 생성(관측성 연동 도입 시)
- **flaky**: `test:` 테스트명 · `quarantined_at:` 날짜 · `owner:` — **14일 내 수리 또는 삭제**(constitution §8, 만료는 done-check가 경고)

## 소비

사람이 검토해 가치 있으면 **Issue로 직접 승격 등록**한다(등록은 사람만 — Claude는 이슈를 만들지 않는다). 승격 후 인박스 파일은 해당 스펙 PR에서 삭제한다(이력은 git이 보존).
