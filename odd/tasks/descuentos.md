# Feature: descuentos

Branch: `feat/descuentos` (from main 5c51c3e). Design approved by owner 2026-10-06.

## Objective
Discount system with three kinds: per-product promo, coupons (incl. personal single-use coupons tied to a phone), and order-total promo. All pricing stays server-side.

## Rules (approved)
1. Product promo (`descuento_pct`, optional `descuento_desde`/`descuento_hasta`) always applies when active. One promo per product.
2. Coupon and total promo apply ONLY to items without an active product promo.
3. Total-promo threshold is measured on the WHOLE cart subtotal (after product promos), but its % applies only to non-promo items.
4. Coupon and total promo never stack: the larger discount wins.
5. Coupon: code, tipo `porcentaje|monto`, valor, optional `vence_at`, optional `usos_max`, `usos`, optional `telefono` (if set, order phone must match by normalized digits), `activo`. A fixed-amount coupon never exceeds the eligible subtotal.
6. Coupon is consumed at order creation (optimistic conditional update on `usos`), released when the order goes to `cancelado`.
7. No quantity discounts (products are sold as packs). No stacking coupons. No per-customer limit beyond the phone binding.

## Data (migration SQL in supabase/, applied by owner BEFORE deploy)
- `cupones` table; RLS on; `authenticated` ALL policy (same pattern as pedidos_all_auth); no anon grants.
- `productos`: `descuento_pct numeric null`, `descuento_desde timestamptz null`, `descuento_hasta timestamptz null`.
- `pedidos`: `subtotal numeric`, `descuento numeric default 0`, `cupon_codigo text null`, `descuento_tipo text null`.
- `pedido_items`: `precio_lista numeric null` (precio_unitario = charged price).
- Total promo lives in `configuracion` (SiteConfig + DEFAULT_CONFIG) as `promoMonto {activo, minimo, pct, desde, hasta}`.

## Surfaces
- Store: strikethrough price for active product promos; cart coupon input + preview via `POST /api/cupones/validar` (rate-limited); discount line in cart.
- MP: if order has descuento > 0, single item "Pedido Sano y Rico #N" at the stored total.
- Dashboard: new `descuentos` section (coupons list/create/toggle, "Generar cupón personal" with random code + phone, total promo editor); product promo fields in productos page.
- Emails show subtotal/discount.

## Tasks
- [x] D1 Migration SQL + types
- [x] D2 Pure pricing extension (`cotizar`) + tests (RED first)
- [x] D3 `/api/pedidos` applies discounts, consumes coupon; estado route releases coupon on cancel
- [x] D4 `/api/cupones/validar` + proxy rate-limit bucket
- [x] D5 Store UI: strikethrough + cart coupon + discount line
- [x] D6 MP preference single-item when discounted; emails
- [x] D7 Dashboard: descuentos section + product promo fields + nav link
- [x] D8 pnpm test / lint / build green

Route: delegated (writer trigger: many non-trivial files). Delivery: work-unit commits on the branch; owner merges.

## Progress / Evidence
- D1 5a817b3: `supabase/migrations/20261007000000_descuentos.sql` (idempotent, RLS + authenticated policy, anon revoked), README row 3, types + `promoMonto` default inactive.
- D2 `src/lib/pedidos/descuentos.ts` + `cotizar.ts`; RED observed (29 failed) then GREEN (80 tests). Money rounded with `redondear` (2 decimals, per unit price, per line, per discount, total). Minimum order is checked against the FINAL (discounted) total. Tie coupon vs total promo: total promo wins (does not burn the coupon). Coupon requested but invalid/no eligible items: 422.
- D3 `/api/pedidos` consumes coupon (optimistic, 3 tries) before insert, releases on insert failure; estado route releases on cancel (`src/lib/pedidos/cupones.ts` + tests).
- D4 `/api/cupones/validar` + proxy bucket `cupones:<ip>` 10/min (public). Messages for unknown coupon and foreign phone are identical.
- D5 Productos strikethrough/-X% badge, Cart coupon box + discount lines (server preview, debounced).
- D6 create-preference: single item `Pedido Sano y Rico #N` at pedidos.total when descuento > 0; emails show subtotal/descuento.
- D7 `/dashboard/descuentos`, product promo fields, nav link. Optional pedidos dashboard detail skipped (`pedidos_detalle` view does not expose new columns).
- D8 `pnpm test` 95 passed, `pnpm lint` 0 errors (1 pre-existing warning), `pnpm build` OK.

## Next step
Owner applies the migration BEFORE deploy, then reviews/merges. Follow-ups: recreate `pedidos_detalle` to expose discount columns if the dashboard should show them; MP webhook only confirms (no cancel path), so no coupon release needed there.
