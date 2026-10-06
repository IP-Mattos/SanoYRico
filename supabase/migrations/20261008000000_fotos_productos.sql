-- RUN BEFORE deploying feat/fotos-reales.
-- Adds up to 4 real photo URLs per product. Idempotent: safe to re-run.

alter table public.productos
  add column if not exists fotos text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'productos_fotos_max_4'
      and conrelid = 'public.productos'::regclass
  ) then
    alter table public.productos
      add constraint productos_fotos_max_4 check (cardinality(fotos) <= 4);
  end if;
end $$;
