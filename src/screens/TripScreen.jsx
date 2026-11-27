import { useState } from 'preact/hooks';
import { finishTrip, moveProduct, setDone } from '../db.js';
import { SECTIONS } from '../data/sections.js';
import { groupForStore, sectionFor } from '../logic/grouping.js';
import { plural } from '../logic/text.js';
import { Sheet } from '../components/ui.jsx';

export function TripScreen({ list, productMap, store, go, toast }) {
  const [moving, setMoving] = useState(null);
  const groups = groupForStore(store, list, productMap);
  const total = list.length;
  const left = list.filter((e) => !e.done).length;
  const doneCount = total - left;
  let nextFound = false;

  const finish = async () => {
    const n = await finishTrip();
    toast(`Убрано ${n} ${plural(n, 'товар', 'товара', 'товаров')}`);
  };

  return (
    <>
      <div class="trhead">
        <button class="storebtn" onClick={() => go('store')}>
          {store.name}
          <small>Сменить магазин</small>
        </button>
        <span class="tag">
          осталось {left} из {total}
        </span>
      </div>
      <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={doneCount}>
        <i style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
      </div>
      {total === 0 ? (
        <p class="empty">
          Список пуст.{' '}
          <button class="linkish" onClick={() => go('list')}>
            Добавить товары
          </button>
        </p>
      ) : (
        <>
          <div class="route">
            {groups.map((g) => {
              const allDone = g.items.every((i) => i.entry.done);
              let cls = allDone ? 'done' : '';
              if (!allDone && !nextFound) {
                cls = 'next';
                nextFound = true;
              }
              const leftHere = g.items.filter((i) => !i.entry.done).length;
              return (
                <section class={'stop ' + cls} key={g.id}>
                  <h2>
                    <span>{g.name}</span>
                    <span>{leftHere || ''}</span>
                  </h2>
                  {g.items.map(({ entry, product }) => (
                    <div class={'item' + (entry.done ? ' dn' : '')} key={entry.id}>
                      <label>
                        <input type="checkbox" checked={entry.done} onChange={(e) => setDone(entry.id, e.currentTarget.checked)} />
                        <span class="t">
                          {product.nameRu}
                          {entry.note && <span class="note"> · {entry.note}</span>}
                          {product.namePl && <span class="pl">{product.namePl}</span>}
                          {store.overrides?.[product.id] && <span class="ov">перенесено сюда</span>}
                        </span>
                      </label>
                      <button class="mv" onClick={() => setMoving(product)} aria-label={`Перенести ${product.nameRu} в другой отдел`}>
                        Перенести
                      </button>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
          <button class="btn wide ghost" onClick={finish} disabled={doneCount === 0}>
            Закончить, убрать отмеченные
          </button>
        </>
      )}
      {moving && (
        <MoveSheet
          product={moving}
          store={store}
          onClose={() => setMoving(null)}
          onPick={async (sec) => {
            await moveProduct(store.id, moving.id, sec);
            setMoving(null);
            toast(`Запомнено для ${store.name}`);
          }}
        />
      )}
    </>
  );
}

function MoveSheet({ product, store, onPick, onClose }) {
  const cur = sectionFor(store, product);
  const order = [...store.route, ...SECTIONS.map((s) => s.id).filter((id) => !store.route.includes(id))];
  const names = Object.fromEntries(SECTIONS.map((s) => [s.id, s.nameRu]));
  return (
    <Sheet title={`${product.nameRu} в другом месте?`} sub={`Запомним только для ${store.name}.`} onClose={onClose}>
      {order.map((id) => (
        <button class={'opt' + (id === cur ? ' cur' : '')} onClick={() => onPick(id)}>
          {names[id]}
          {id === cur && <span class="tag"> сейчас</span>}
        </button>
      ))}
    </Sheet>
  );
}
