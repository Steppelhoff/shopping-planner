import { plural } from '../logic/text.js';

export function StoreScreen({ stores, store, pickStore, go }) {
  return (
    <>
      <h1 class="ttl">Где сегодня?</h1>
      <p class="sub">Один магазин за поход. Список отсортируется под него.</p>
      {stores.map((s) => {
        const k = Object.keys(s.overrides || {}).length;
        const r = s.route.length - s.hidden.length;
        return (
          <button
            class={'store' + (s.id === store.id ? ' on' : '')}
            onClick={async () => {
              await pickStore(s.id);
              go('trip');
            }}
          >
            <b>{s.name}</b>
            <span>{s.address}</span>
            <span>
              {r} {plural(r, 'отдел', 'отдела', 'отделов')} на маршруте
              {k > 0 && `, ${k} ${plural(k, 'товар перенесён', 'товара перенесены', 'товаров перенесено')}`}
            </span>
          </button>
        );
      })}
    </>
  );
}
