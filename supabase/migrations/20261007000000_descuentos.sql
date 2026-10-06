-- ============================================================================
-- RUN BEFORE deploying branch feat/descuentos.
-- Not executed automatically: the owner applies this in the Supabase SQL editor.
--
-- Adds the discount system: coupons table, product promo columns and the columns
-- that store the applied discount on orders. Idempotent: safe to run more than once.
-- ============================================================================

-- 1) Coupons. Codes are stored uppercase; the API uppercases input before lookup.
create table if not exists public.cupones (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null,
  tipo        text not null check (tipo in ('porcentaje', 'monto')),
  valor       numeric not null check (valor > 0),
  vence_at    timestamptz null,
  usos_max    integer null check (usos_max is null or usos_max > 0),
  usos        integer not null default 0 check (usos >= 0),
  telefono    text null,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint cupones_codigo_mayusculas check (codigo = upper(codigo)),
  constraint cupones_porcentaje_rango check (tipo <> 'porcentaje' or valor <= 100)
);

create unique index if not exists cupones_codigo_key on public.cupones (codigo);

-- 2) RLS: only the admin (authenticated) manages coupons. Customers never read this table:
--    /api/cupones/validar and /api/pedidos use the service role.
alter table public.cupones enable row level security;

drop policy if exists cupones_all_auth on public.cupones;
create policy cupones_all_auth on public.cupones
  for all to authenticated
  using (true)
  with check (true);

revoke all on public.cupones from anon;
grant select, insert, update, delete on public.cupones to authenticated;

-- 3) Product promo (one promo per product; dates optional).
alter table public.productos add column if not exists descuento_pct numeric null
  check (descuento_pct is null or (descuento_pct > 0 and descuento_pct <= 100));
alter table public.productos add column if not exists descuento_desde timestamptz null;
alter table public.productos add column if not exists descuento_hasta timestamptz null;

-- 4) Discount applied to each order (pedido_items.precio_unitario stays the charged price).
alter table public.pedidos add column if not exists subtotal numeric null;
alter table public.pedidos add column if not exists descuento numeric not null default 0;
alter table public.pedidos add column if not exists cupon_codigo text null;
alter table public.pedidos add column if not exists descuento_tipo text null
  check (descuento_tipo is null or descuento_tipo in ('cupon', 'monto'));

alter table public.pedido_items add column if not exists precio_lista numeric null;

-- Note: pedidos_detalle is NOT recreated here, so it does not expose the new order columns.
-- The total promo lives in public.configuracion under clave 'promoMonto' (no schema change).
