import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app.jsx';
import { seed } from './db.js';
import './styles.css';

registerSW({ immediate: true });

// Ask the browser to keep our data even when storage is low.
navigator.storage?.persist?.().catch(() => {});

seed()
  .catch((e) => console.error('seed failed', e))
  .finally(() => render(<App />, document.getElementById('app')));
