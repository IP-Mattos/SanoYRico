-- NOT WIRED INTO CODE YET. Not executed: the owner applies this in the Supabase SQL editor.
-- Inserts a pedido and its items atomically (replaces the manual rollback in /api/pedidos).
-- Items must already be priced server-side (see src/lib/pedidos/cotizar.ts).
-- p_items: [{producto_id, producto_nombre, producto_emoji, cantidad, precio_unitario, subtotal}]

create or replace function public.crear_pedido(
  p_nombre text,
  p_telefono text,
  p_email text,
  p_direccion text,
  p_notas text,
  p_metodo_pago text,
  p_total numeric,
  p_items jsonb
)
returns table (id uuid, numero integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_numero integer;
begin
  insert into public.pedidos (nombre, telefono, email, direccion, notas, metodo_pago, total)
  values (p_nombre, p_telefono, p_email, p_direccion, p_notas, p_metodo_pago, p_total)
  returning pedidos.id, pedidos.numero into v_id, v_numero;

  insert into public.pedido_items
    (pedido_id, producto_id, producto_nombre, producto_emoji, cantidad, precio_unitario, subtotal)
  select
    v_id,
    nullif(i->>'producto_id', '')::uuid,
    i->>'producto_nombre',
    i->>'producto_emoji',
    (i->>'cantidad')::integer,
    (i->>'precio_unitario')::numeric,
    (i->>'subtotal')::numeric
  from jsonb_array_elements(p_items) as i;

  return query select v_id, v_numero;
end;
$$;

revoke all on function public.crear_pedido(text, text, text, text, text, text, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.crear_pedido(text, text, text, text, text, text, numeric, jsonb) to service_role;
