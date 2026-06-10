# ADR 0002 — 연속 CHANGELOG.html (main 커밋마다 재생성)

## Context

main의 변경 이력을 사람이 보려면 git log나 GitHub UI를 읽어야 했다. 비개발 이해관계자(또는 코드를 열지 않는 검토자)가 "지금까지 무엇이 바뀌었나"를 한 파일로 보는 수단이 없었다. release.yml은 태그 시점에만 노트를 만들어 태그 사이 공백이 있다.

운영자 지시(2026-06-10): main에 커밋이 쌓일 때마다 CHANGELOG.html을 새로 생성해 사람이 보기 쉽게 할 것. 보호 경로(constitution·참조 문서·.claude) 개정이 포함되나, 운영자의 명시 지시 = AMEND 승인 등가로 처리했다.

## Decision

1. 생성기 `.claude/hooks/changelog.sh`(이벤트 훅 아님, spec-lint와 같은 결정론 도구)를 추가한다.
2. **단일 진실은 git log(main 계보), CHANGELOG.html은 파생물.** 손편집 금지 — 다음 재생성이 덮는다.
3. 엔트리 단위 = **main 커밋**(= PR squash). 브랜치 WIP 커밋은 squash에서 소멸하므로 대상이 아니다.
4. 표준 경로 = `/ship ①`: `changelog.sh --pending "<PR제목>"`으로 자기 엔트리를 선반영해 squash 커밋이 자신의 changelog를 품는다. main 직접 커밋 예외(솔로 폴백·부트스트랩·AMEND)도 커밋 직전 동일 실행.
5. 병합 충돌·엔트리 누락(동시 출하의 stale 창)은 수선하지 않고 재생성으로 해소한다 — 이력에서 다시 그려지므로 자가 치유.

## Consequences

- (+) main 커밋마다 사람용 변경 뷰 최신화. release 노트(태그 단위)와 상보.
- (+) 파생물 설계라 충돌 해석 비용이 0(재생성 한 줄).
- (−) 병렬 볼트가 둘 다 CHANGELOG.html을 만지므로 REFACTOR/머지큐에서 충돌 빈도 증가 — 해소는 기계적이나 G2 후 충돌 시 재승인 비용 발생(/ship 순서 규칙이 그대로 적용).
- (−) 동시 출하 시 한 엔트리가 다음 /ship까지 누락될 수 있는 stale 창 존재 — 다음 재생성이 자동 복원.

## 관련 볼트

부트스트랩 직후 제도 변경 — 볼트 없음. 적용 파일: AUTONOMOUS-STACK-REFERENCE.md(R4.1), specs/constitution.md §13, CLAUDE.md, .claude/commands/ship.md·bolt.md, README.md.
