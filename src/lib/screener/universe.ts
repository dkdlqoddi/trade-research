// data/stock-universe.md 파서 — 유니버스의 단일 진실은 md 파일이다 (specs/001 R1)
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type UniverseEntry = {
  ticker: string;
  name: string;
  category: string;
  leveraged: boolean;
  note: string;
};

const TICKER_RE = /^[A-Z][A-Z0-9.-]{0,9}$/;
// 레버리지·인버스 판별 — 비고의 배율 표기 (R10, [ASSUMED 8])
const LEVERAGED_RE = /(-?[0-9](\.[0-9])?x\b|레버리지|인버스)/i;

export function parseUniverseMd(text: string): UniverseEntry[] {
  const out: UniverseEntry[] = [];
  let category = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      category = line.slice(3).trim();
      continue;
    }
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    // "| a | b | c |" → ['', a, b, c, ''] — 최소 3칸
    if (cells.length < 4) continue;
    const ticker = cells[1];
    if (!TICKER_RE.test(ticker)) continue; // 헤더('티커')·구분선('---') 배제
    const note = cells[3] ?? '';
    out.push({
      ticker,
      name: cells[2],
      category,
      leveraged: LEVERAGED_RE.test(note) || category.includes('레버리지'),
      note,
    });
  }
  return out;
}

export async function loadUniverse(): Promise<UniverseEntry[]> {
  const p = path.join(process.cwd(), 'data', 'stock-universe.md');
  return parseUniverseMd(await readFile(p, 'utf8'));
}
