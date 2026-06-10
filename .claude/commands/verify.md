---
description: VERIFY·REVIEW 페이즈만 재실행 — 예측 절은 보존, 실측만 갱신.
argument-hint: NNN
---

# /verify $ARGUMENTS

NNN = $ARGUMENTS. SPEC_DIR = `specs/NNN-*`. 구현을 다시 검증만 한다(설계·구현 변경 금지).

## 규칙

- `verification.md`의 **`## 예측` 절은 절대 갱신하지 않는다** — 블라인드 검증의 기준점이다. 예측을 다시 쓰면 이중 검증이 무효가 된다(예측 재작성이 필요하면 그것은 스펙 해석 문제 — /spec --revise 검토).
- `## 실측` · `## 판정` · `## e2e 증거` · `## 검역 제외 목록`만 갱신한다.

## 절차

1. phase=VERIFY 기록
2. **spec-verifier 위임** — 기존 `## 예측`을 기준으로 실측 재실행·판정 표 갱신
3. **e2e-tester 위임** — S# 재현, 비주얼, axe, 증거 갱신
4. 판정 표에 불일치·FAIL 있으면: 사유 보고 후 GREEN 복귀 권고(implementer 수정 루프는 /bolt 흐름으로)
5. 전부 PASS면 phase=REVIEW → **code-reviewer 위임** → BLOCK 0건 확인
6. 완료 안내: "/ship NNN 진행 가능"
