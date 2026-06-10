// 수집 엔드포인트 (002 R6 — spec ## 계약 참조)
// GET /api/collect[?force=1] — CRON_SECRET 설정 시 Bearer 인증. vercel.json cron이 평일 호출.
// 수집 후 기본 프리셋 분석을 1회 실행해 일일 스냅샷(R5)을 이 경로에서 권위 저장한다.
import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ensureCollected, getUniverse } from '@/lib/screener/marketdata';
import { analyzeUniverse } from '@/lib/screener/screener';

export const dynamic = 'force-dynamic';

const CONCURRENCY = 6;

// 상수 시간 비교 — 시크릿 비교에 ===를 쓰지 않는다(타이밍 누설, 리뷰 지적)
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !safeEqual(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const force = new URL(req.url).searchParams.get('force') === '1';
  const t0 = Date.now();
  const universe = await getUniverse();
  let collected = 0;
  let failed = 0;

  for (let i = 0; i < universe.length; i += CONCURRENCY) {
    const chunk = universe.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((u) => ensureCollected(u.ticker, { force })),
    );
    for (const r of results) {
      if (r.status === 'fulfilled') collected += 1;
      else failed += 1;
    }
  }

  // 일일 스냅샷 권위 저장(R5) — 캐시 위 순수 계산이라 비용 미미
  await analyzeUniverse('default');

  return NextResponse.json({ ok: true, collected, failed, durationMs: Date.now() - t0 });
}
