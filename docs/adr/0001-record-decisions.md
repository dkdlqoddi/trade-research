# ADR 0001 — 결정은 ADR로 기록한다

## Context

팀 전원이 각자 Claude Code를 쓰는 R4 협업 모델에서, 구두·채팅·세션 안에서만 존재하는 결정은 다른 팀원(그리고 그들의 Claude Code)에게 보이지 않아 같은 논의가 반복되거나 모순된 구현이 발생한다. 볼트 내부 결정은 design.md Decision Log가 담지만, **볼트를 넘는 결정**(아키텍처, 컨벤션, 도구 채택, 계약 방침)을 담는 영속 장소가 없었다.

## Decision

- 영향이 한 볼트의 touches를 넘거나 둘 이상의 볼트에 적용되는 결정은 `docs/adr/NNNN-제목.md`로 기록한다.
- 형식: **Context / Decision / Consequences / 관련 볼트** 4절.
- 번호는 0001부터 증가. 폐기는 삭제가 아니라 새 ADR이 이전 ADR을 supersede 한다고 명시.
- design.md에서 해당 ADR을 링크한다. **구두·채팅 결정은 무효**(constitution §9).
- `docs/adr/`는 보호 경로 — 수정은 AMEND 절차 + CODEOWNERS 리뷰.

## Consequences

- (+) 어느 팀원의 Claude Code든 같은 결정 맥락을 읽는다 — 조정 비용을 회의가 아니라 파일로 지불.
- (+) /retro가 분기마다 결정 이력을 데이터로 회고할 수 있다.
- (−) 결정마다 작은 쓰기 비용 — 단, ADR 없는 "큰 결정"은 리뷰(G2)에서 변경 요청 사유가 된다.

## 관련 볼트

(부트스트랩 — 해당 없음)
