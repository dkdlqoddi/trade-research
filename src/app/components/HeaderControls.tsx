'use client';

// 헤더 도구 — 수동 갱신(R12)·테마(R15)·표 밀도(R15)
import { useEffect, useState } from 'react';

const THEME_KEY = 'ui-theme';
const DENSITY_KEY = 'ui-density';

export function HeaderControls() {
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [density, setDensity] = useState<'normal' | 'compact'>('normal');

  // 저장된 설정 적용 — 마운트 시(짧은 다크 플래시 허용, [ASSUMED 3])
  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
      const d = localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'normal';
      apply(t, d);
      setTheme(t);
      setDensity(d);
    } catch {
      /* 무시 */
    }
  }, []);

  const apply = (t: string, d: string) => {
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.density = d;
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    apply(next, density);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* 무시 */
    }
  };

  const toggleDensity = () => {
    const next = density === 'normal' ? 'compact' : 'normal';
    setDensity(next);
    apply(theme, next);
    try {
      localStorage.setItem(DENSITY_KEY, next);
    } catch {
      /* 무시 */
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      await fetch('/api/collect', { cache: 'no-store' });
      location.reload();
    } catch {
      setBusy(false);
    }
  };

  return (
    <span className="header-controls">
      <button onClick={refresh} disabled={busy} aria-label="데이터 갱신" title="수집 엔드포인트 호출 후 새로고침">
        {busy ? '갱신 중…' : '↻ 갱신'}
      </button>
      <button onClick={toggleTheme} aria-label="테마 전환" title="다크/라이트">
        {theme === 'dark' ? '☀ 테마' : '☾ 테마'}
      </button>
      <button onClick={toggleDensity} aria-label="표 밀도 전환" title="기본/조밀">
        ≡ 밀도
      </button>
    </span>
  );
}
