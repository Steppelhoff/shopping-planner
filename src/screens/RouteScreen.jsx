import { useRef } from 'preact/hooks';
import { resetRoute, saveRoute, toggleHidden } from '../db.js';
import { sectionName } from '../data/sections.js';
import { CHAIN_NAMES } from '../data/stores.js';
import { groupForStore } from '../logic/grouping.js';

export function RouteScreen({ stores, store, pickStore, list, productMap, toast }) {
  const listRef = useRef();
  const drag = useRef(null);
  const counts = {};
  for (const g of groupForStore({ ...store, hidden: [] }, list, productMap)) counts[g.id] = g.items.length;

  const commit = () => {
    const ids = [...listRef.current.children].map((r) => r.dataset.id);
    saveRoute(store.id, ids);
  };
  const onDown = (e) => {
    drag.current = e.currentTarget.closest('.rrow');
    drag.current.classList.add('drag');
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onMove = (e) => {
    const row = drag.current;
    if (!row) return;
    const y = e.clientY;
    for (const r of listRef.current.children) {
      if (r === row) continue;
      const b = r.getBoundingClientRect();
      if (y > b.top && y < b.bottom) {
        listRef.current.insertBefore(row, y > b.top + b.height / 2 ? r.nextSibling : r);
        break;
      }
    }
    // Scroll the page while dragging near the edges.
    if (y < 80) window.scrollBy(0, -12);
    else if (y > window.innerHeight - 120) window.scrollBy(0, 12);
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current.classList.remove('drag');
    drag.current = null;
    commit();
  };
  const move = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= store.route.length) return;
    const r = store.route.slice();
    [r[i], r[j]] = [r[j], r[i]];
    saveRoute(store.id, r);
  };

  return (
    <>
      <h1 class="ttl">Маршрут</h1>
      <p class="sub">Перетащите отделы в порядке обхода, вход сверху. Маршрут хранится только на этом телефоне.</p>
      <div class="seg">
        {stores.map((s) => (
          <button class={'chip' + (s.id === store.id ? ' on' : '')} onClick={() => pickStore(s.id)}>
            {CHAIN_NAMES[s.chain]}
          </button>
        ))}
      </div>
      {/* key: rebuild rows after a save so the DOM order matches the data */}
      <div ref={listRef} key={store.id + store.route.join()}>
        {store.route.map((id, i) => {
          const hidden = store.hidden.includes(id);
          return (
            <div class={'rrow' + (hidden ? ' hid' : '')} data-id={id}>
              <button
                class="handle"
                aria-label={`Переместить: ${sectionName(id)}. Стрелки вверх и вниз`}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') move(i, -1);
                  else if (e.key === 'ArrowDown') move(i, 1);
                  else return;
                  e.preventDefault();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                </svg>
              </button>
              <span class="num">{i + 1}</span>
              <span class="rn">{sectionName(id)}</span>
              {counts[id] > 0 && <span class="cnt">{counts[id]} в списке</span>}
              <button class="eye" onClick={() => toggleHidden(store.id, id)} aria-pressed={hidden}>
                {hidden ? 'Показать' : 'Пропуск'}
              </button>
            </div>
          );
        })}
      </div>
      <button
        class="btn wide ghost"
        onClick={async () => {
          if (!confirm(`Вернуть исходный маршрут ${CHAIN_NAMES[store.chain]}? Ваш порядок отделов сбросится.`)) return;
          await resetRoute(store.id);
          toast('Исходный маршрут возвращён');
        }}
      >
        Вернуть исходный маршрут {CHAIN_NAMES[store.chain]}
      </button>
    </>
  );
}
