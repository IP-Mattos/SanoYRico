# Feature: flyers

Branch: `feat/flyers` (from feat/rediseno). Design approved by owner 2026-10-06.

## Objective
Dashboard section to build shareable product flyers (PNG) for WhatsApp / Instagram.

## Approved design
- New dashboard section `flyers`: pick 1-6 products, format `cuadrado` (1080x1080) or `historia` (1080x1920), optional title (default provided), optional coupon line, live preview, Download PNG, Share (Web Share API with file; fallback download).
- Flyer content: logo + brand palette + display font, per product image + name + price (strikethrough + "-X%" when promo active, same helper as the store), site URL footer, optional coupon text.
- Generation server-side with `next/og` ImageResponse at a protected route; admin session required (proxy PROTECTED_APIS + in-route getUser check).
- Uses current product `imagen_url` (real photos are a later feature).

## Tasks
- [x] F1 Protected `GET /api/flyers` (ImageResponse) + pure layout/params helper + tests
- [x] F2 Dashboard page `dashboard/flyers` + nav link
- [x] F3 lint / test / build green

Route: delegated writer.

## Progress / Evidence
- F1: `GET /api/flyers` (nodejs, ImageResponse, no-store), proxy PROTECTED_APIS + in-route getUser. Pure helpers `src/lib/flyers/{params,layout}.ts` with vitest. Fonts: Playfair Display 700 + DM Sans 400/600 as static woff (fontsource, latin) in public/fonts with OFL texts. Images: only supabase public-bucket PNG/JPEG as data URI; otherwise emoji tile.
- F2: dashboard page with picker/format/title/coupon/debounced preview/download/share + nav link.
- F3: pnpm test 104 passed, pnpm lint 0 problems, pnpm build ok. Unauthenticated GET /api/flyers -> 401 (dev server).
- Samples rendered via temporary vitest (not committed).
