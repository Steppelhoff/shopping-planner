import { useMemo, useState } from 'preact/hooks';
import { db, getMeta, setMeta } from './db.js';
import { useLive } from './hooks.js';
import { useToast } from './components/ui.jsx';
import { ListScreen } from './screens/ListScreen.jsx';
import { StoreScreen } from './screens/StoreScreen.jsx';
import { TripScreen } from './screens/TripScreen.jsx';
import { RouteScreen } from './screens/RouteScreen.jsx';
import { ShareScreen } from './screens/ShareScreen.jsx';
import { InstallHint } from './screens/InstallHint.jsx';

const NAV = [
  ['list', 'Список', <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />],
  ['trip', 'Поход', <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><path d="M6 7v4a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4" /></>],
  ['route', 'Маршрут', <path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" />],
  ['share', 'Обмен', <path d="M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />],
];

export function App() {
  const [screen, setScreen] = useState('list');
  const [toast, toastEl] = useToast();
  const products = useLive(() => db.products.toArray(), [], null);
  const list = useLive(() => db.list.orderBy('id').toArray(), [], null);
  const stores = useLive(() => db.stores.toArray(), [], null);
  const storeId = useLive(() => getMeta('currentStore'), [], null);
  const productMap = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);

  if (!products || !list || !stores) return <div class="app"><p class="empty">Загрузка…</p></div>;

  const order = ['lidl', 'kaufland', 'auchan'];
  const sortedStores = [...stores].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const store = stores.find((s) => s.id === storeId) || sortedStores[0];
  const pickStore = (id) => setMeta('currentStore', id);
  const go = (s) => {
    setScreen(s);
    window.scrollTo(0, 0);
  };
  const ctx = { products, productMap, list, stores: sortedStores, store, pickStore, go, toast };

  const Screen = { list: ListScreen, store: StoreScreen, trip: TripScreen, route: RouteScreen, share: ShareScreen }[screen];
  const active = screen === 'store' ? 'trip' : screen;

  return (
    <div class="app">
      <main class="body">
        {screen === 'list' && <InstallHint />}
        <Screen {...ctx} />
      </main>
      <nav class="nav">
        {NAV.map(([id, label, icon]) => (
          <button class={id === active ? 'on' : ''} aria-current={id === active ? 'page' : undefined} onClick={() => go(id)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              {icon}
            </svg>
            {label}
          </button>
        ))}
      </nav>
      {toastEl}
    </div>
  );
}
