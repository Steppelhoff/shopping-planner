# Покупки: shopping planner

A grocery list for the family that sorts itself into the order you walk
through the store. One store per trip: Lidl Chyliczki, Kaufland Piaseczno
or Auchan Piaseczno.

The app is in Russian, and every product also shows its Polish shelf name
(for example «Ветчина для детей» with *szynka*).

## How it works

- **Local only.** Each phone keeps its own data in the browser (IndexedDB).
  There is no server, no account and no sign-in.
- **Sharing a list.** «Обмен → Отправить .txt» opens the share sheet; send the
  file over Telegram. The other person pastes the text or picks the file in
  «Получить список». Import only adds items that are missing; it never deletes.
- **Routes are personal.** Each person sets the section order for each store
  on their own phone («Маршрут»). «Перенести» during a trip remembers where a
  product really is, for that store only. Routes are never exchanged.
- **Backup.** «Резервная копия» saves this phone's products, routes and list
  as a JSON file, for moving to a new phone.

### List file format

```
Покупки, 27.11
Молоко — mleko
Ветчина для детей — szynka (2 шт)
Авокадо
```

One product per line: Russian name, ` — `, Polish name, and an optional note
in brackets. The header line is optional, so a hand-typed Telegram message
imports too. Products are matched by either name, ignoring case and ё/е.

## Install on iPhone

Open the site in Safari, tap Share, then «На экран „Домой“». Installed this
way it works offline, and Safari does not wipe its data after 7 days without
a visit (which it can do for ordinary websites).

## Development

```
npm install
npm run dev      # local dev server
npm test         # unit tests (logic and database)
npm run build    # production build in dist/
```

Stack: Preact, Vite, Dexie (IndexedDB), vite-plugin-pwa (offline service
worker and manifest).

| Path | What |
| --- | --- |
| `src/data/` | sections, the three stores with starting routes, starter product catalogue |
| `src/logic/` | list file format, sorting by route, name matching |
| `src/db.js` | database and every data change |
| `src/screens/` | the five screens: list, store pick, trip, route, exchange |
| `test/` | Vitest tests |

The starting routes are guesses: Lidl and Kaufland start with fruit and
vegetables, Auchan Piaseczno is the least certain. Fix them in the store.

## Deploy

`.github/workflows/deploy.yml` runs tests and the build on every pull request,
and on every push to `main` it publishes `dist/` to GitHub Pages.
One-time setup: in the repository's Settings → Pages, set Source to
**GitHub Actions**.
