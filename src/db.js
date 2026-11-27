// All data lives on this phone, in IndexedDB. Nothing is sent anywhere.
import Dexie from 'dexie';
import { SEED_PRODUCTS } from './data/products.js';
import { SEED_ROUTES, SEED_STORES } from './data/stores.js';
import { isSection } from './data/sections.js';
import { capitalize, findProduct } from './logic/text.js';
import { parseList } from './logic/listfile.js';

export function createDb(name = 'shopping-planner') {
  const db = new Dexie(name);
  db.version(1).stores({
    products: '++id, nameRu, namePl',
    stores: 'id',
    list: '++id, productId',
    meta: 'key',
  });
  return db;
}

export const db = createDb();

export async function seed(d = db) {
  await d.transaction('rw', d.products, d.stores, d.meta, async () => {
    if (await d.meta.get('seeded')) return;
    await d.products.bulkAdd(
      SEED_PRODUCTS.map(([nameRu, namePl, section]) => ({ nameRu, namePl, section, timesBought: 0 })),
    );
    await d.stores.bulkPut(structuredClone(SEED_STORES));
    await d.meta.put({ key: 'currentStore', value: 'lidl' });
    await d.meta.put({ key: 'seeded', value: true });
  });
}

export async function getMeta(key, d = db) {
  return (await d.meta.get(key))?.value;
}

export function setMeta(key, value, d = db) {
  return d.meta.put({ key, value });
}

// ---- Products ----

export async function createProduct({ nameRu, namePl = '', section = null }, d = db) {
  const id = await d.products.add({
    nameRu: capitalize(nameRu),
    namePl: String(namePl).trim(),
    section: isSection(section) ? section : null,
    timesBought: 0,
  });
  return d.products.get(id);
}

export function updateProduct(id, changes, d = db) {
  const c = { ...changes };
  if ('nameRu' in c) c.nameRu = capitalize(c.nameRu);
  if ('namePl' in c) c.namePl = String(c.namePl).trim();
  return d.products.update(id, c);
}

// ---- List ----

// Adds a product to the list unless it is already there. Returns true if added.
export async function addToList(productId, note = '', d = db) {
  const existing = await d.list.where('productId').equals(productId).first();
  if (existing) return false;
  await d.list.add({ productId, note, done: false, addedAt: Date.now() });
  return true;
}

// Typed text: match a known product by Russian or Polish name, or create one.
// Returns { product, added, created }.
export async function addByName(name, d = db) {
  const products = await d.products.toArray();
  let product = findProduct(products, name);
  let created = false;
  if (!product) {
    product = await createProduct({ nameRu: name }, d);
    created = true;
  }
  const added = await addToList(product.id, '', d);
  return { product, added, created };
}

export function removeFromList(entryId, d = db) {
  return d.list.delete(entryId);
}

export function setDone(entryId, done, d = db) {
  return d.list.update(entryId, { done });
}

export function setNote(entryId, note, d = db) {
  return d.list.update(entryId, { note: String(note).trim() });
}

// End of a trip: ticked items leave the list and count as bought.
export async function finishTrip(d = db) {
  return d.transaction('rw', d.list, d.products, async () => {
    const done = await d.list.filter((e) => e.done).toArray();
    for (const e of done) {
      const p = await d.products.get(e.productId);
      if (p) await d.products.update(p.id, { timesBought: (p.timesBought || 0) + 1 });
    }
    await d.list.bulkDelete(done.map((e) => e.id));
    return done.length;
  });
}

// ---- Import of a list file ----
// Only adds: lines already on the list are skipped, nothing is deleted.
export async function importList(text, d = db) {
  const lines = parseList(text);
  const res = { added: 0, already: 0, created: 0, total: lines.length };
  await d.transaction('rw', d.products, d.list, async () => {
    const products = await d.products.toArray();
    for (const line of lines) {
      let p = findProduct(products, line.nameRu) || (line.namePl && findProduct(products, line.namePl));
      if (!p) {
        p = await createProduct({ nameRu: line.nameRu, namePl: line.namePl }, d);
        products.push(p);
        res.created++;
      } else if (!p.namePl && line.namePl) {
        await updateProduct(p.id, { namePl: line.namePl }, d);
      }
      if (await addToList(p.id, line.note, d)) res.added++;
      else res.already++;
    }
  });
  return res;
}

// ---- Stores ----

export function saveRoute(storeId, route, d = db) {
  return d.stores.update(storeId, { route });
}

export async function toggleHidden(storeId, sectionId, d = db) {
  const s = await d.stores.get(storeId);
  const hidden = s.hidden.includes(sectionId)
    ? s.hidden.filter((x) => x !== sectionId)
    : [...s.hidden, sectionId];
  return d.stores.update(storeId, { hidden });
}

export async function resetRoute(storeId, d = db) {
  const s = await d.stores.get(storeId);
  return d.stores.update(storeId, { route: SEED_ROUTES[s.chain].slice(), hidden: [] });
}

// "Перенести": remember where a product really is, in this store only.
// A product with no section at all gets it as its default instead.
export async function moveProduct(storeId, productId, sectionId, d = db) {
  await d.transaction('rw', d.stores, d.products, async () => {
    const p = await d.products.get(productId);
    const s = await d.stores.get(storeId);
    const overrides = { ...s.overrides };
    if (!p.section) {
      await d.products.update(productId, { section: sectionId });
      delete overrides[productId];
    } else if (sectionId === p.section) {
      delete overrides[productId];
    } else {
      overrides[productId] = sectionId;
    }
    const hidden = s.hidden.filter((x) => x !== sectionId);
    await d.stores.update(storeId, { overrides, hidden });
  });
}

// ---- Backup: this phone's products, routes and list as one JSON file ----

export async function exportBackup(d = db) {
  return {
    app: 'shopping-planner',
    version: 1,
    exportedAt: new Date().toISOString(),
    products: await d.products.toArray(),
    stores: await d.stores.toArray(),
    list: await d.list.toArray(),
    meta: (await d.meta.toArray()).filter((m) => m.key === 'currentStore'),
  };
}

export async function restoreBackup(data, d = db) {
  if (!data || data.app !== 'shopping-planner' || !Array.isArray(data.products) || !Array.isArray(data.stores)) {
    throw new Error('Это не резервная копия этого приложения');
  }
  await d.transaction('rw', d.products, d.stores, d.list, d.meta, async () => {
    await Promise.all([d.products.clear(), d.stores.clear(), d.list.clear()]);
    await d.products.bulkPut(data.products);
    await d.stores.bulkPut(data.stores);
    await d.list.bulkPut(data.list || []);
    for (const m of data.meta || []) await d.meta.put(m);
    await d.meta.put({ key: 'seeded', value: true });
  });
}

