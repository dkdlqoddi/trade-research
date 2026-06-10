// 피처 플래그 레지스트리 (specs/constitution.md — 트렁크 기반 개발)
// 규칙: 모든 플래그는 만료일 주석 필수. 형식 `expires: YYYY-MM-DD`
// done-check 훅이 만료일 경과를 경고한다. 만료 플래그는 제거하거나 연장 사유를 기록한다.
export const FLAGS = {
  // expires: 2026-09-10 — 부트스트랩 예시 플래그. 첫 실제 플래그 추가 시 제거.
  exampleFeature: false,
} as const;

export type FlagName = keyof typeof FLAGS;

// 킬스위치: 사고 시 재배포보다 빠른 복구 수단. 환경변수 1 = 전체 플래그 강제 off.
export function isEnabled(name: FlagName): boolean {
  if (process.env.NEXT_PUBLIC_FLAGS_KILL_SWITCH === '1') return false;
  return FLAGS[name];
}
