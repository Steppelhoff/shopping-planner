import { useEffect, useRef, useState } from 'preact/hooks';
import { SECTIONS } from '../data/sections.js';

export function Sheet({ title, sub, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('input,button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div class="sheet" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet-in" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div class="sheet-head">
          <h3>{title}</h3>
          <button class="x" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        {sub && <p class="sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

// Names and section of a product. Used for new products and for editing.
export function ProductSheet({ product, title, sub, onSave, onClose }) {
  const [ru, setRu] = useState(product.nameRu);
  const [pl, setPl] = useState(product.namePl || '');
  const save = (section) => onSave({ nameRu: ru.trim() || product.nameRu, namePl: pl.trim(), section });
  return (
    <Sheet title={title} sub={sub} onClose={onClose}>
      <label class="fld">
        <span>По-русски</span>
        <input value={ru} onInput={(e) => setRu(e.currentTarget.value)} />
      </label>
      <label class="fld">
        <span>По-польски, как на полке</span>
        <input value={pl} onInput={(e) => setPl(e.currentTarget.value)} placeholder="например, szynka" autocapitalize="off" />
      </label>
      <div class="lab">Отдел</div>
      {SECTIONS.map((s) => (
        <button class={'opt' + (s.id === product.section ? ' cur' : '')} onClick={() => save(s.id)}>
          {s.nameRu}
          {s.id === product.section && <span class="tag"> сейчас</span>}
        </button>
      ))}
    </Sheet>
  );
}

let toastTimer;
export function useToast() {
  const [msg, setMsg] = useState('');
  const show = (m) => {
    setMsg(m);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setMsg(''), 2500);
  };
  const el = (
    <div class={'toast' + (msg ? ' on' : '')} role="status" aria-live="polite">
      {msg}
    </div>
  );
  return [show, el];
}
