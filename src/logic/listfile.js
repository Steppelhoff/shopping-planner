// The .txt list file sent between phones over Telegram.
//
//   Покупки, 27.11
//   Молоко — mleko
//   Ветчина для детей — szynka (2 шт)
//   Авокадо
//
// One product per line: Russian name, then " — " and the Polish name.
// An optional note goes in brackets at the end. The header line is optional
// on import, so a hand-typed Telegram message works too.
import { ddmm } from './text.js';

export const HEADER = 'Покупки';

export function formatList(items, date = new Date()) {
  const lines = items.map(({ nameRu, namePl, note }) => {
    let line = namePl ? `${nameRu} — ${namePl}` : nameRu;
    if (note) line += ` (${note})`;
    return line;
  });
  return [`${HEADER}, ${ddmm(date)}`, ...lines].join('\n') + '\n';
}

const HEADER_RE = /^покупки(?!\p{L})/iu;
const BULLET_RE = /^(?:[-•*·–—]|\d+[.)]|\[[ xх]?\]|[☐☑✓✔])\s*/i;
const SEP_RE = /\s+[—–-]\s+|\s*[—–]\s*/;
const NOTE_RE = /\s*\(([^()]*)\)\s*$/;

export function parseList(text) {
  const out = [];
  const lines = String(text ?? '').replace(/^﻿/, '').split(/\r?\n/);
  for (const raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    if (HEADER_RE.test(line)) continue;
    line = line.replace(BULLET_RE, '').trim();
    if (!line) continue;
    let note = '';
    const m = line.match(NOTE_RE);
    if (m) {
      note = m[1].trim();
      line = line.slice(0, m.index).trim();
    }
    const [ru, ...rest] = line.split(SEP_RE);
    const nameRu = (ru || '').trim();
    const namePl = rest.join(' ').trim();
    if (!nameRu && !namePl) continue;
    out.push({ nameRu: nameRu || namePl, namePl, note });
  }
  return out;
}
