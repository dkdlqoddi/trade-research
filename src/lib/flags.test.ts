import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { FLAGS, isEnabled, type FlagName } from './flags';

const flagNames = Object.keys(FLAGS) as FlagName[];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('flags', () => {
  it('레지스트리 값을 그대로 반환한다', () => {
    for (const name of flagNames) {
      expect(isEnabled(name)).toBe(FLAGS[name]);
    }
  });

  // Invariant: 킬스위치가 켜지면 플래그 값과 무관하게 전부 off (속성 테스트)
  it('킬스위치 on이면 모든 플래그가 off다', () => {
    vi.stubEnv('NEXT_PUBLIC_FLAGS_KILL_SWITCH', '1');
    fc.assert(
      fc.property(fc.constantFrom(...flagNames), (name) => {
        expect(isEnabled(name)).toBe(false);
      }),
    );
  });
});
