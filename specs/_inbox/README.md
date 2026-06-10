# specs/_inbox/ — 의도 수집함

GitHub Issues를 쓰지 않는다(constitution §12). **아이디어·버그·운영 신호는 전부 여기에 .md 파일로** — 팀원 누구나 커밋 가능, 모든 팀원의 Claude Code가 자기 체크아웃에서 읽는다.

## 사용법

1. 파일 생성: `specs/_inbox/<kind>-<주제>.md` (예: `idea-guest-cart.md`, `bug-login-redirect.md`, `flaky-S3-checkout.md`)
2. 파일 머리(필수):
   ```yaml
   kind: idea | bug | ops | flaky
   by: "@깃헙핸들"
   date: 2026-06-10
   ```
3. 본문:
   - **idea**: 무엇을, 왜(사용자 가치), 대략의 범위
   - **bug**: 재현 절차 · 기대 동작 vs 실제 동작 · 환경
   - **ops**: 관측 데이터 출처와 신호(에러 클러스터, 퍼널 이상)
   - **flaky**: `test:` 테스트명 · `quarantined_at:` 날짜 · `owner:` — 14일 내 수리 또는 삭제(constitution §8)
4. 커밋·push: `git add specs/_inbox/... && git commit -m "inbox: <주제>" && git push`

## 소비

스펙으로 승격할 때: `/spec _inbox/<파일명>` — spec-writer가 흡수해 EARS 스펙 초안을 만들고, 처리된 인박스 파일은 그 스펙 PR에서 삭제한다(이력은 git이 보존).
