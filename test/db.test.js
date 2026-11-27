import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addByName, createDb, exportBackup, finishTrip, importList, moveProduct, resetRoute,
  restoreBackup, seed, setDone, toggleHidden,
} from '../src/db.js';

let d;
let n = 0;
beforeEach(async () => {
  d = createDb('test-' + n++);
  await seed(d);
});

describe('db', () => {
  it('seeds once', async () => {
    const count = await d.products.count();
    await seed(d);
    expect(await d.products.count()).toBe(count);
    expect((await d.stores.toArray()).map((s) => s.id).sort()).toEqual(['auchan', 'kaufland', 'lidl']);
  });

  it('adds by Russian or Polish name, no duplicates, creates unknown', async () => {
    expect((await addByName('молоко', d)).added).toBe(true);
    expect((await addByName('mleko', d)).added).toBe(false);
    const r = await addByName('хрен', d);
    expect(r).toMatchObject({ added: true, created: true });
    expect(r.product).toMatchObject({ nameRu: 'Хрен', section: null });
  });

  it('import only adds new items and learns Polish names', async () => {
    await addByName('Молоко', d);
    const r = await importList('Покупки, 26.11\nМолоко — mleko\nЙогурт — jogurt\nХрен — chrzan\nszynka', d);
    expect(r).toEqual({ added: 3, already: 1, created: 1, total: 4 });
    expect(await d.list.count()).toBe(4);
    const chrzan = await d.products.where('nameRu').equals('Хрен').first();
    expect(chrzan).toMatchObject({ namePl: 'chrzan', section: null });
  });

  it('finishing a trip removes ticked items and counts them', async () => {
    await addByName('Молоко', d);
    await addByName('Хлеб', d);
    const milk = await d.list.toCollection().first();
    await setDone(milk.id, true, d);
    expect(await finishTrip(d)).toBe(1);
    expect(await d.list.count()).toBe(1);
    expect((await d.products.get(milk.productId)).timesBought).toBe(1);
  });

  it('moving sets a per-store override, or the default for unknown products', async () => {
    const hummus = await d.products.where('nameRu').equals('Хумус').first();
    await moveProduct('lidl', hummus.id, 'deli', d);
    const lidl = await d.stores.get('lidl');
    expect(lidl.overrides[hummus.id]).toBe('deli');
    expect(lidl.hidden).not.toContain('deli');
    expect((await d.stores.get('kaufland')).overrides[hummus.id]).toBeUndefined();
    await moveProduct('lidl', hummus.id, 'dairy', d);
    expect((await d.stores.get('lidl')).overrides[hummus.id]).toBeUndefined();

    const { product } = await addByName('Хрен', d);
    await moveProduct('auchan', product.id, 'spice', d);
    expect((await d.products.get(product.id)).section).toBe('spice');
    expect((await d.stores.get('auchan')).overrides).toEqual({});
  });

  it('route hide and reset', async () => {
    await toggleHidden('kaufland', 'pets', d);
    expect((await d.stores.get('kaufland')).hidden).toEqual(['pets']);
    await d.stores.update('kaufland', { route: ['dairy', 'fruit'] });
    await resetRoute('kaufland', d);
    const k = await d.stores.get('kaufland');
    expect(k.hidden).toEqual([]);
    expect(k.route[0]).toBe('fruit');
  });

  it('backup round-trips', async () => {
    await addByName('Хрен', d);
    const data = JSON.parse(JSON.stringify(await exportBackup(d)));
    const d2 = createDb('restore-' + n++);
    await restoreBackup(data, d2);
    expect(await d2.products.count()).toBe(await d.products.count());
    expect(await d2.list.count()).toBe(1);
    await expect(restoreBackup({ foo: 1 }, d2)).rejects.toThrow();
  });
});
