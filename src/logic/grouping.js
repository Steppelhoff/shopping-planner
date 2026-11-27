import { OTHER, sectionName } from '../data/sections.js';

// Where a product is in this store: the store's own fix first, else the
// product's default section, else nowhere (null).
export function sectionFor(store, product) {
  return (store?.overrides && store.overrides[product.id]) || product.section || null;
}

// Lay the list out in the store's walking order.
// entries: [{ id, productId, done, note }], products: Map id -> product
// Returns [{ id, name, items: [{ entry, product }] }]; empty sections are left out.
// Items in hidden sections, or without a section, go to "Другое" at the end.
export function groupForStore(store, entries, products) {
  const by = new Map();
  for (const entry of entries) {
    const product = products.get(entry.productId);
    if (!product) continue;
    const sec = sectionFor(store, product) || OTHER.id;
    if (!by.has(sec)) by.set(sec, []);
    by.get(sec).push({ entry, product });
  }
  const hidden = new Set(store.hidden || []);
  const out = [];
  const placed = new Set();
  for (const id of store.route) {
    placed.add(id);
    if (hidden.has(id) || !by.has(id)) continue;
    out.push({ id, name: sectionName(id), items: by.get(id) });
  }
  const rest = [];
  for (const [id, items] of by) {
    if (!placed.has(id) || hidden.has(id)) rest.push(...items);
  }
  if (rest.length) out.push({ id: OTHER.id, name: OTHER.nameRu, items: rest });
  return out;
}
