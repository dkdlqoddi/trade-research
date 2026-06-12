# trade-research

자율 개발 스택 (AI-DLC × SDD × TDD × BDD) — 운영 헌법은 `CLAUDE.md`, 불변 원칙은 `specs/constitution.md`, 구축·운영 참조는 `AUTONOMOUS-STACK-REFERENCE.md`.

- **변경 이력(사람용)**: [`CHANGELOG.html`](./CHANGELOG.html) — main 커밋마다 재생성된다 (생성기 `.claude/hooks/changelog.sh`, 손편집 금지)
- **의도 제안**: GitHub Issue 폼으로 등록(`[FEAT]`/`[BUG]`/`[CHORE]`/`[REFACTOR]`/`[SPIKE]` — 등록은 사람만). `specs/_inbox/`는 기계 피드백(ops·flaky) 전용.
- 보안 취약점은 **이슈·PR 금지**(퍼블릭 리포 — 이슈는 전체 공개). 신고는 GitHub **private vulnerability reporting**([`.github/SECURITY.md`](./.github/SECURITY.md), ADR 0003). 실자격증명·시크릿·PoC는 어디에도 금지.
- 온보딩: clone → `gh auth login` → `claude` → `/hooks` 승인 → `/status` → 이슈 작성 후 `/spec #N` (현행 솔로 운용은 터미널 `/spec <설명>` 직행 가능 — `issue: null`)
