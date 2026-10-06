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
- [ ] P1 Migration SQL + types
- [ ] P2 Protected upload/delete/reorder route + tests for pure helpers
- [ ] P3 Dashboard productos UI
- [ ] P4 Store button + lightbox
- [ ] P5 Flyers toggle
- [ ] P6 lint / test / build green

Route: delegated writer.

## Progress / Evidence
(pending)
