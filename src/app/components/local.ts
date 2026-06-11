'use client';

// localStorage 유틸 — 관심목록·마지막 방문 (003 [ASSUMED 1])
import { useEffect, useState } from 'react';

export const WATCH_KEY = 'watchlist';
export const VISIT_KEY = 'lastVisit';

export function readWatch(): Set<string> {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function writeWatch(next: Set<string>): void {
  try {
    localStorage.setItem(WATCH_KEY, JSON.stringify([...next]));
  } catch {
    /* 저장 불가 환경 무시 */
  }
}

// 직전 방문 시각을 읽고, 이번 방문을 기록한다 — 반환값은 "직전" 방문(R5 비교 기준).
// 여러 컴포넌트가 같은 훅을 써도 페이지 로드당 1회만 기록(모듈 캐시) — 늦게 마운트된 쪽이
// "방금 기록된 now"를 직전 방문으로 오인하는 버그 방지.
let cachedPrevVisit: string | null | undefined;

export function useLastVisit(): string | null {
  const [prev, setPrev] = useState<string | null>(null);
  useEffect(() => {
    try {
      if (cachedPrevVisit === undefined) {
        cachedPrevVisit = localStorage.getItem(VISIT_KEY);
        localStorage.setItem(VISIT_KEY, new Date().toISOString());
      }
      setPrev(cachedPrevVisit);
    } catch {
      /* 무시 */
    }
  }, []);
  return prev;
}

// 관심목록 구독 훅 — 같은 페이지의 다른 컴포넌트(탐색 표 ↔ 관심 구간)와 이벤트로 동기화
export function useWatchlist(): [Set<string>, (ticker: string) => void] {
  const [watch, setWatch] = useState<Set<string>>(new Set());

  useEffect(() => {
    setWatch(readWatch());
    const sync = () => setWatch(readWatch());
    window.addEventListener('watchlist-change', sync);
    return () => window.removeEventListener('watchlist-change', sync);
  }, []);

  const toggle = (ticker: string) => {
    const next = new Set(readWatch());
    if (next.has(ticker)) next.delete(ticker);
    else next.add(ticker);
    writeWatch(next);
    window.dispatchEvent(new CustomEvent('watchlist-change'));
  };

  return [watch, toggle];
}
