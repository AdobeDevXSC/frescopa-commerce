# Installable app (PWA)

The site can be installed as an app (Chrome, Edge, Android "Install app"; Safari "Add to Home Screen" / "Add to Dock").

| File | Purpose |
|---|---|
| `manifest.webmanifest` | Name "Fréscopa Coffee & Tea" (short "Fréscopa"), standalone display, roast splash, crema theme colour, icons. |
| `icons/app-icon-192.png`, `app-icon-512.png` | App icons: the logo's bean mark on midnight roast. |
| `icons/app-icon-maskable-512.png` | The same mark inside the maskable safe zone (Android adaptive icons). |
| `icons/apple-touch-icon.png` | 180×180 icon for iOS and macOS Safari. |
| `head.html` | Links the manifest and Apple icon, sets `theme-color`, allows the worker with `worker-src 'self'`. |
| `sw.js` | Service worker, registered from `loadDelayed()` in `scripts/scripts.js` (not on `localhost`). |

## What the service worker caches
- **Pages, fragments, JSON:** nothing. Content always comes from the network, so it is never stale and there is no offline page.
- **Code** (`/scripts`, `/styles`, `/blocks`): network-first; the cached copy is used only when the network fails, so a deploy never mixes old and new files.
- **Fonts and icons:** stale-while-revalidate.
- **Media** (`media_…` files, which are content-hashed): cache-first, up to 80 entries.

## Maintenance
- Changing caching behaviour in `sw.js`: bump `VERSION` so old caches are deleted on activation.
- New icons: replace the PNGs at the same sizes (the maskable mark should fit within the central 80% circle).
- To remove the app behaviour: delete the `register()` call, and ship an `sw.js` that unregisters itself (`self.registration.unregister()`) for at least one release so installed copies stop using the old worker.
