# Security Policy

퍼블릭 리포지토리입니다 — **취약점을 이슈·PR·코멘트에 올리지 마세요**(전체 공개됩니다).

## 신고 경로 (단일)

[Private vulnerability reporting](https://github.com/dkdlqoddi/trade-research/security/advisories/new) — Security 탭 → "Report a vulnerability".

포함할 내용:

- **영향 범위** — 영향받는 기능·데이터·사용자 (무엇이 노출/오염될 수 있는가)
- **재현 경로** — 최소 서술. 실자격증명·시크릿·PoC 페이로드는 어디에도 금지
- **심각도** — Critical(자격증명/자금/PII 직접 노출) / High(권한 우회·데이터 변조) / Medium(제한적 정보 노출) / Low(심층 방어 약화)
- **노출 기간** — 추정 가능하면 도입 커밋·배포 시점

## 처리

핫픽스 레인: 축소 게이트로 즉시 수정 + 24시간 내 테스트·스펙 소급, touches 우선권 (ADR 0003).
수정 PR·커밋에도 취약점 상세를 쓰지 않으며, 공개 여부·시점은 머지 후 advisory에서 결정합니다.
