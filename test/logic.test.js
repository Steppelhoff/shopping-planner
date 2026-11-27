import { describe, expect, it } from 'vitest';
import { formatList, parseList } from '../src/logic/listfile.js';
import { groupForStore, sectionFor } from '../src/logic/grouping.js';
import { findProduct, norm, plural, suggest } from '../src/logic/text.js';

const P = [
  { id: 1, nameRu: 'Молоко', namePl: 'mleko', section: 'dairy' },
  { id: 2, nameRu: 'Ветчина для детей', namePl: 'szynka', section: 'meat' },
  { id: 3, nameRu: 'Бананы', namePl: 'banany', section: 'fruit' },
  { id: 4, nameRu: 'Хумус', namePl: 'hummus', section: 'dairy' },
  { id: 5, nameRu: 'Горчица', namePl: '', section: null },
  { id: 6, nameRu: 'Свёкла', namePl: 'buraki', section: 'fruit' },
];
const map = new Map(P.map((p) => [p.id, p]));
const store = {
  id: 'lidl',
  route: ['fruit', 'bakery', 'dairy', 'meat', 'deli'],
  hidden: ['deli'],
  overrides: {},
};

describe('text', () => {
  it('normalises case, spaces and ё', () => {
    expect(norm('  Свёкла  Красная ')).toBe('свекла красная');
  });
  it('finds by Russian or Polish name', () => {
    expect(findProduct(P, 'МОЛОКО').id).toBe(1);
    expect(findProduct(P, 'szynka').id).toBe(2);
    expect(findProduct(P, 'свекла').id).toBe(6);
    expect(findProduct(P, 'хлеб')).toBeUndefined();
  });
  it('suggests prefix matches first and skips excluded', () => {
    expect(suggest(P, 'ba').map((p) => p.id)).toEqual([3]);
    expect(suggest(P, 'мол', new Set([1])).map((p) => p.id)).toEqual([]);
    expect(suggest(P, 'дет').map((p) => p.id)).toEqual([2]);
  });
  it('Russian plurals', () => {
    expect([1, 2, 5, 11, 21, 22, 25].map((n) => plural(n, 'товар', 'товара', 'товаров'))).toEqual([
      'товар', 'товара', 'товаров', 'товаров', 'товар', 'товара', 'товаров',
    ]);
  });
});

describe('list file', () => {
  it('formats with header, Polish names and notes', () => {
    const txt = formatList(
      [
        { nameRu: 'Молоко', namePl: 'mleko', note: '' },
        { nameRu: 'Ветчина для детей', namePl: 'szynka', note: '2 шт' },
        { nameRu: 'Авокадо', namePl: '', note: '' },
      ],
      new Date(2026, 10, 27),
    );
    expect(txt).toBe('Покупки, 27.11\nМолоко — mleko\nВетчина для детей — szynka (2 шт)\nАвокадо\n');
  });
  it('round-trips', () => {
    const items = [
      { nameRu: 'Молоко', namePl: 'mleko', note: '' },
      { nameRu: 'Сок', namePl: 'sok', note: 'яблочный' },
    ];
    expect(parseList(formatList(items))).toEqual(items);
  });
  it('accepts hand-typed messages, bullets and dashes', () => {
    expect(parseList('молоко\n- хлеб - chleb\n• Сыр–ser\n\n2) яйца\n☐ Кофе — kawa')).toEqual([
      { nameRu: 'молоко', namePl: '', note: '' },
      { nameRu: 'хлеб', namePl: 'chleb', note: '' },
      { nameRu: 'Сыр', namePl: 'ser', note: '' },
      { nameRu: 'яйца', namePl: '', note: '' },
      { nameRu: 'Кофе', namePl: 'kawa', note: '' },
    ]);
  });
  it('keeps hyphenated names whole', () => {
    expect(parseList('Чай Earl-Grey')[0].nameRu).toBe('Чай Earl-Grey');
  });
});

describe('grouping', () => {
  const entries = [1, 2, 3, 4, 5].map((pid, i) => ({ id: i + 1, productId: pid, done: false }));
  it('orders sections by the route and drops empty ones', () => {
    const g = groupForStore(store, entries, map);
    expect(g.map((x) => x.id)).toEqual(['fruit', 'dairy', 'meat', 'other']);
    expect(g[1].items.map((i) => i.product.nameRu)).toEqual(['Молоко', 'Хумус']);
    expect(g[3].items.map((i) => i.product.nameRu)).toEqual(['Горчица']);
  });
  it('applies store overrides and sends hidden sections to Другое', () => {
    const s = { ...store, overrides: { 4: 'deli' } };
    expect(sectionFor(s, map.get(4))).toBe('deli');
    const g = groupForStore(s, entries, map);
    expect(g.at(-1).items.map((i) => i.product.nameRu)).toEqual(['Хумус', 'Горчица']);
    const shown = groupForStore({ ...s, hidden: [] }, entries, map);
    expect(shown.map((x) => x.id)).toEqual(['fruit', 'dairy', 'meat', 'deli', 'other']);
  });
});
