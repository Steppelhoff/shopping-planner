// Normalise a product name for matching: case, spaces and ё/е don't matter.
export function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

export function capitalize(s) {
  const t = String(s ?? '').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

// Russian plural: plural(5, 'товар', 'товара', 'товаров') -> 'товаров'
export function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function ddmm(d = new Date()) {
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
}

// Find a product by its Russian or Polish name.
export function findProduct(products, name) {
  const k = norm(name);
  if (!k) return undefined;
  return products.find((p) => norm(p.nameRu) === k) || products.find((p) => norm(p.namePl) === k);
}

// Suggestions while typing: names that start with the query first, then contain it.
export function suggest(products, query, excludeIds = new Set(), limit = 5) {
  const q = norm(query);
  if (!q) return [];
  const pool = products.filter((p) => !excludeIds.has(p.id));
  const starts = pool.filter((p) => norm(p.nameRu).startsWith(q) || norm(p.namePl).startsWith(q));
  const contains = pool.filter(
    (p) => !starts.includes(p) && (norm(p.nameRu).includes(q) || norm(p.namePl).includes(q)),
  );
  return [...starts, ...contains].slice(0, limit);
}
