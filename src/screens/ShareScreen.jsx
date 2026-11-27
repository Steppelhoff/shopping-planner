import { useRef, useState } from 'preact/hooks';
import { exportBackup, importList, restoreBackup } from '../db.js';
import { formatList } from '../logic/listfile.js';
import { ddmm, plural } from '../logic/text.js';

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Opens the iPhone share sheet with a file (pick Telegram there).
// Falls back to copying the text, then to a download.
async function shareFile(name, text, type) {
  try {
    const file = new File([text], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return 'shared';
    }
  } catch (e) {
    if (e.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    download(name, text, type);
    return 'downloaded';
  }
}

export function ShareScreen({ list, productMap, go, toast }) {
  const [imp, setImp] = useState('');
  const fileRef = useRef();
  const backupRef = useRef();

  const items = list
    .filter((e) => !e.done)
    .map((e) => ({ ...productMap.get(e.productId), note: e.note }))
    .filter((p) => p.nameRu);
  const text = formatList(items);
  const fname = `pokupki-${ddmm().replace('.', '-')}.txt`;

  const send = async () => {
    const r = await shareFile(fname, text, 'text/plain');
    if (r === 'copied') toast('Текст скопирован, вставьте его в Telegram');
    if (r === 'downloaded') toast('Файл сохранён');
  };

  const doImport = async (txt) => {
    if (!txt.trim()) return toast('Вставьте текст списка');
    const r = await importList(txt);
    setImp('');
    let msg = `Добавлено ${r.added}`;
    if (r.already) msg += `, уже было ${r.already}`;
    if (r.created) msg += `. ${r.created} ${plural(r.created, 'новый товар', 'новых товара', 'новых товаров')}: выберите отдел`;
    toast(msg);
    go('list');
  };

  const readFile = async (e, then) => {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (f) then(await f.text());
  };

  const saveBackup = async () => {
    const data = JSON.stringify(await exportBackup(), null, 1);
    const r = await shareFile(`pokupki-kopiya-${new Date().toISOString().slice(0, 10)}.json`, data, 'application/json');
    if (r === 'copied') toast('Копия скопирована как текст');
    if (r === 'downloaded') toast('Копия сохранена');
  };

  const loadBackup = async (txt) => {
    let data;
    try {
      data = JSON.parse(txt);
    } catch {
      return toast('Файл не читается');
    }
    if (!confirm('Заменить все товары, маршруты и список на этом телефоне данными из копии?')) return;
    try {
      await restoreBackup(data);
      toast('Восстановлено из копии');
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <>
      <h1 class="ttl">Обмен</h1>
      <p class="sub">Список ходит между телефонами файлом. Сервер не нужен.</p>

      <div class="card">
        <h2>Отправить список</h2>
        <p class="sub">
          {items.length} {plural(items.length, 'неотмеченный товар', 'неотмеченных товара', 'неотмеченных товаров')}. Откроется «Поделиться», выберите Telegram.
        </p>
        <pre class="file">{text}</pre>
        <button class="btn wide" onClick={send} disabled={!items.length}>
          Отправить .txt
        </button>
      </div>

      <div class="card">
        <h2>Получить список</h2>
        <p class="sub">Вставьте текст из Telegram или выберите файл. Новое добавится, старое не удалится.</p>
        <textarea value={imp} onInput={(e) => setImp(e.currentTarget.value)} placeholder={'Молоко — mleko\nХлеб — chleb'} aria-label="Текст списка" />
        <div class="two">
          <button class="btn ghost" onClick={() => fileRef.current.click()}>
            Выбрать файл
          </button>
          <button class="btn" onClick={() => doImport(imp)}>
            Импорт
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".txt,text/plain" hidden onChange={(e) => readFile(e, doImport)} />
      </div>

      <div class="card">
        <h2>Резервная копия</h2>
        <p class="sub">Товары, маршруты, переносы и список этого телефона. На случай нового телефона. Никому не отправляется, если вы сами не выберете.</p>
        <div class="two">
          <button class="btn ghost" onClick={saveBackup}>
            Сохранить копию
          </button>
          <button class="btn ghost" onClick={() => backupRef.current.click()}>
            Восстановить
          </button>
        </div>
        <input ref={backupRef} type="file" accept=".json,application/json" hidden onChange={(e) => readFile(e, loadBackup)} />
      </div>
    </>
  );
}
