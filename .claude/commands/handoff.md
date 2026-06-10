---
description: 진행 중 볼트를 다른 팀원에게 인계 — 스냅샷 강제 기록, owner 갱신, push, 로컬 상태 정리.
argument-hint: NNN <인수자 @핸들>
---

# /handoff $ARGUMENTS

인자: NNN과 인수자 GitHub 핸들. SPEC_DIR = `specs/NNN-*`.

## 절차

1. **컴팩션 스냅샷 강제 기록** — `bash .claude/hooks/pre-compact.sh < /dev/null` 또는 동일 형식으로 design.md에 직접 append:
   `### 컴팩션 스냅샷 $(date -Iseconds)` + phase / tasks 완료·잔여 / 다음 행동 1줄 / 미해결 결정
   인수자가 이것만 읽고 이어받을 수 있게 **현재 맥락(막혔던 지점, 시도한 것)을 충실히** 쓴다.
2. **owner 갱신** — spec.md frontmatter `owner:` 를 인수자로 (Edit, frontmatter owner 필드만 — guard 허용 예외). tasks.md frontmatter `owner:`도 동일 갱신.
3. **커밋·push** (ask):
   ```bash
   git add specs/NNN-*
   git commit -m "handoff(NNN): → @인수자"
   git push
   ```
4. **내 로컬 상태 정리**:
   ```bash
   : > .claude/state/active-bolt
   echo -n "IDLE" > .claude/state/phase
   rm -f .claude/state/locks/NNN.paths
   ```
   (락 파일은 인수자의 /bolt가 자기 것으로 재생성한다 — touches 점유는 원격 tasks.md가 원본이므로 공백 없음)
5. 안내: "인수자는 `git fetch` 후 `/bolt NNN` 으로 이어받으세요 — SessionStart 훅이 스냅샷 위치를 주입합니다."
