---
description: 분기 1회 회고(사람 호출) — 운영 데이터를 모아 constitution/프로세스 개정안을 AMEND PR 초안으로 제안.
---

# /retro

분기 1회, 사람이 호출한다. **채택은 리뷰가 결정 — 나는 제안까지만.**

## 1. 수집 (읽기 전용)

- 머지된 볼트들의 design.md **Decision Log** + `docs/adr/` 전체 — 반복 패턴, 뒤집힌 결정
- **검역 목록**: `specs/_inbox/flaky-*.md` + 코드의 `@quarantine` — 14일 초과 잔존, 반복 격리 대상
- **nightly 지표**: `gh run view`(nightly 최근 실행) — 전체 뮤테이션 점수 추이, 감사 결과
- done-check **HOLD/에스컬레이션 이력**(예산 초과 빈도), `[ASSUMED]` 중 검증 안 된 채 남은 것

## 2. 분석

- 게이트가 못 잡은 결함이 G2/운영에서 발견된 사례 → 어느 슬롯(post-edit/done-check/CI) 보강?
- 게이트 오탐으로 낭비된 볼트 시간 → 어느 검사 완화/이동?
- WIP·리뷰 SLA 위반 빈도 → 한도 조정?
- spec-lint-words.txt 증감 후보

## 3. AMEND PR 초안 제안

개정 대상이 보호 경로(`specs/constitution.md` · `.claude/**` · `docs/adr/**`)이므로 **AMEND 절차**를 따른다:
1. 사람이 터미널에서 "AMEND 승인"을 명시하면 phase=AMEND 기록
2. 브랜치 `amend/<주제>` → 개정안 커밋 → push(ask) → PR 생성(ask)
3. 본문: 변경 전/후 diff 요약 + 근거 데이터(위 수집 결과) + **"훅 변경 포함 시: 전원 /hooks 재승인 필요"** 명시
4. CODEOWNERS 리뷰 필수 — 머지 후 phase=IDLE 복귀
