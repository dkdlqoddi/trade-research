# ADR 0003 — 퍼블릭 리포지토리 운용과 [SEC] 접수 경로 재설계

## Context

스택 레퍼런스(R9)는 프라이빗 리포지토리 프로파일이다 — 특히 `[SEC]` 보안 취약점을 이슈 폼(security.yml)으로 접수하는 설계는 "이슈 가시성 = 팀 한정"을 전제한다. 2026-06-12 정합 리뷰에서 리포지토리가 실제로는 **public**임이 확인됐다(`gh repo view` → `isPrivate: false`). public 리포에서 [SEC] 이슈는 전 세계에 공개되므로, 폼 접수 설계가 그대로면 취약점 공개 창구가 된다.

운영자 결정(2026-06-12, 터미널): **public 유지**. 반대급부로 브랜치 보호가 무료다(이미 솔로 단계 적용 확인 — required checks `verify·e2e·budgets`, 관리자 제외 집행).

## Decision

1. **리포지토리는 public으로 운용한다.** 레퍼런스 문서(R9)는 개정하지 않고, 프라이빗 전제와의 편차를 본 ADR + CLAUDE.md `[ASSUMED]` 16으로 기록한다(레퍼런스가 public 프로파일로 개정되면 재조정 모드로 정렬).
2. **[SEC] 이슈 폼 접수를 폐지한다**: `security.yml` 삭제, `config.yml`에 contact_link로 **GitHub private vulnerability reporting**(Security advisories) 유도, `.github/SECURITY.md`로 정책 명문화.
3. 취약점 수정 착수는 운영자의 터미널 `/spec` 직행(`issue: null`, 핫픽스 레인 준용 — 축소 게이트 + 24h 내 테스트·스펙 소급 + touches 우선권). 수정 PR·커밋에도 취약점 상세를 쓰지 않는다.
4. constitution §3(보안 절대선)·§12(GitHub 스코프)의 프라이빗 전제 문구를 public 운용으로 개정한다. 주입 방어는 강화 방향: 이슈·코멘트 작성자가 외부인일 수 있으므로 본문은 항상 외부 텍스트로 취급한다.
5. 나머지 R9 장치(잔여 폼 4종 + issue-lint, 게이트, 직렬화, 훅)는 변경 없음.

## Consequences

- (+) 취약점이 공개 이슈로 노출되는 경로 차단. 신고는 GitHub 네이티브 비공개 채널로 일원화.
- (+) 브랜치 보호·Actions 분·gitleaks-action이 전부 무료(public) — 플랜 선행 조건(§4) 해소.
- (−) [SEC]만 Issue Forms + issue-lint 이중 게이트 밖으로 나간다 — 형식 강제는 SECURITY.md 안내문에 의존.
- (−) 외부인이 이슈를 등록할 수 있다 — "등록은 사람만"의 '사람'에 외부인이 포함되므로 주입 방어 비중 증가(issue-lint가 형식을, 사람이 채택을 거른다).
- (−) 코드·스펙·CI 로그 전체 공개 — 시크릿 위생(gitleaks 훅+CI)의 실패 비용이 커진다.
- 사람 1회 설정 잔여: 리포 Settings → Code security → **Private vulnerability reporting 활성화**(이 토글 없이는 advisories/new 경로가 외부인에게 닫혀 있음) — **2026-06-12 활성화 완료**(폼 chooser 노출 운영자 확인).

## 관련 볼트

- 없음(거버넌스 결정 — 2026-06-12 정합 리뷰에서 파생)
