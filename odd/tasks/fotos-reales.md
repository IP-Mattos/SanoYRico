# Feature: fotos-reales

Branch: `feat/fotos-reales` (from main edabae0). Design approved by owner 2026-10-06 (option 1).

## Objective
Besides the illustrations, each product can have 1-4 real photos that customers can open from the product card.

## Approved design
- Store: card keeps the illustration; products with photos show a "Ver fotos reales" camera button; it opens an accessible lightbox/gallery (swipe on mobile, arrows/keyboard on desktop).
- Dashboard Productos: per product "Fotos reales" section: upload 1-4 photos (desktop or phone), reorder, delete, first one marked as cover.
- Upload goes through a protected server route (service role), images are resized server-side with sharp to JPEG (max 1600px, ~q82) into the public `productos` bucket under `fotos/<producto_id>/`.
- Flyers: toggle "Usar fotos reales"; products with photos use their first photo instead of the illustration.
- Data: `productos.fotos text[] not null default '{}'` (max 4), SQL migration applied by the owner BEFORE deploy.

## Tasks
- [x] P1 Migration SQL + types
- [x] P2 Protected upload/delete/reorder route + tests for pure helpers
- [x] P3 Dashboard productos UI
- [x] P4 Store button + lightbox
- [x] P5 Flyers toggle
- [x] P6 lint / test / build green

Route: delegated writer.

## Progress / Evidence
- P1/P2 0955241: migration `supabase/migrations/20261008000000_fotos_productos.sql` (RUN BEFORE deploy), `Producto.fotos?: string[] | null` (optional so partial selects/pre-migration reads tolerate it; every reader uses `fotosDe()`), route `/api/productos/[id]/fotos` (POST/DELETE/PATCH, proxy + in-route session), helpers + 13 vitest cases in `src/lib/productos/`.
- P3 9fe72c9: `FotosReales.tsx` in the product edit modal (edit only). Client downsizes to 1600px JPEG before upload because hosting body limits (~4.5 MB on Vercel) are below 10 MB phone photos; server re-encodes with sharp regardless.
- P4 3b076ca: `FotosLightbox.tsx` (portal, focus trap, Esc/arrows/swipe, counter, thumbnails) + card button (icon+count on mobile, "Ver fotos reales" from sm).
- P5 665bbbe: `fotos=1` param, dashboard toggle; photo falls back to illustration then emoji. `fotos` column only selected when the toggle is on.
- Verified: pnpm test (112 pass), lint 0 errors, tsc clean, build OK; unauthenticated POST/PATCH returns 401; lightbox screenshots rendered locally with injected fake fotos (hack not committed).
- Not verified: real upload/delete/reorder against Supabase (no writes allowed), HEIC decoding (sharp prebuilt usually lacks it; error 415 shown), migration application.

- Requirement change (owner): photos must show only the product. POST now runs sharp normalize (rotate, 1600px) -> Replicate background removal only (same pinned model as /api/remove-bg; helpers in `src/lib/productos/replicate.ts`, remove-bg route left untouched) -> `.trim()` + max 1200px PNG q9 at `fotos/<id>/<uuid>.png`. `quitarFondo=0` stores the JPEG instead. Failure/timeout (~90 s) returns 502 `code: fondo_fallido`, never stores the original silently; dashboard has "Quitar fondo (recomendado)" (default on) and a "Subir esta foto sin quitar el fondo" fallback. Lightbox now shows the cut-out on the cream radial tile. proxy: `fotos:<ip>` 10 POST/min. Tests: replicate (mocked fetch) + imagen (sharp) = 12 new, 125 total.
