import { useState } from 'preact/hooks';
import { addByName, addToList, removeFromList, setNote, updateProduct } from '../db.js';
import { sectionName } from '../data/sections.js';
import { plural, suggest } from '../logic/text.js';
import { ProductSheet, Sheet } from '../components/ui.jsx';

export function ListScreen({ products, productMap, list, go, toast }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // { product, isNew }
  const [noteFor, setNoteFor] = useState(null);

  const inList = new Set(list.map((e) => e.productId));
  const sugg = suggest(products, q, inList);
  const often = products
    .filter((p) => p.timesBought > 0 && !inList.has(p.id))
    .sort((a, b) => b.timesBought - a.timesBought)
    .slice(0, 8);

  const submit = async (e) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    const res = await addByName(t);
    setQ('');
    if (!res.added) toast('Уже в списке');
    else if (res.created) setEditing({ product: res.product, isNew: true });
  };
  const addP = async (p) => {
    setQ('');
    await addToList(p.id);
  };

  const n = list.length;
  return (
    <>
      <h1 class="ttl">Список покупок</h1>
      <p class="sub">
        {n} {plural(n, 'товар', 'товара', 'товаров')} на этом телефоне
      </p>
      <form class="add" onSubmit={submit}>
        <input
          value={q}
          onInput={(e) => setQ(e.currentTarget.value)}
          placeholder="молоко или mleko"
          aria-label="Добавить товар"
          autocomplete="off"
          enterkeyhint="done"
        />
        <button class="btn">Добавить</button>
      </form>
      {sugg.length > 0 && (
        <div class="sugg">
          {sugg.map((p) => (
            <button onClick={() => addP(p)}>
              <span>
                {p.nameRu} <span class="tag">{p.namePl}</span>
              </span>
              <span class="tag">{p.section ? sectionName(p.section) : ''}</span>
            </button>
          ))}
        </div>
      )}
      {often.length > 0 && (
        <>
          <div class="lab">Часто покупаем</div>
          <div class="chips">
            {often.map((p) => (
              <button class="chip" onClick={() => addP(p)}>
                + {p.nameRu}
              </button>
            ))}
          </div>
        </>
      )}
      <div class="lab">В списке</div>
      {n === 0 && <p class="empty">Пока пусто. Добавьте, что нужно купить.</p>}
      {list.map((e) => {
        const p = productMap.get(e.productId);
        if (!p) return null;
        return (
          <div class="row" key={e.id}>
            <button class="nm" onClick={() => setNoteFor(e)} aria-label={`${p.nameRu}: примечание`}>
              <span class={e.done ? 'struck' : ''}>{p.nameRu}</span>
              {e.note && <span class="note"> · {e.note}</span>}
              {p.namePl && <span class="pl">{p.namePl}</span>}
            </button>
            {p.section ? (
              <button class="tag linkish" onClick={() => setEditing({ product: p })}>
                {sectionName(p.section)}
              </button>
            ) : (
              <button class="chip warn" onClick={() => setEditing({ product: p })}>
                Выбрать отдел
              </button>
            )}
            <button class="x" onClick={() => removeFromList(e.id)} aria-label={`Убрать ${p.nameRu}`}>
              ×
            </button>
          </div>
        );
      })}
      {n > 0 && (
        <button class="btn wide" onClick={() => go('store')}>
          В магазин
        </button>
      )}

      {editing && (
        <ProductSheet
          product={editing.product}
          title={editing.isNew ? `${editing.product.nameRu}: где лежит?` : editing.product.nameRu}
          sub={editing.isNew ? 'Новый товар. Спросим один раз.' : 'Названия и обычный отдел. Переносы в конкретном магазине делаются в «Поход».'}
          onClose={() => setEditing(null)}
          onSave={async (c) => {
            await updateProduct(editing.product.id, c);
            setEditing(null);
          }}
        />
      )}
      {noteFor && <NoteSheet entry={noteFor} product={productMap.get(noteFor.productId)} onClose={() => setNoteFor(null)} />}
    </>
  );
}

function NoteSheet({ entry, product, onClose }) {
  const [v, setV] = useState(entry.note || '');
  const save = async (e) => {
    e.preventDefault();
    await setNote(entry.id, v);
    onClose();
  };
  return (
    <Sheet title={product.nameRu} sub="Примечание, например «2 шт» или «без лактозы»." onClose={onClose}>
      <form onSubmit={save}>
        <input class="full" value={v} onInput={(e) => setV(e.currentTarget.value)} placeholder="Примечание" aria-label="Примечание" />
        <button class="btn wide">Сохранить</button>
      </form>
    </Sheet>
  );
}
