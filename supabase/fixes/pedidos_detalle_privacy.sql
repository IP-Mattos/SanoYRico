-- Not executed: the owner applies this in the Supabase SQL editor.
-- Finding: anon can read every row of pedidos_detalle (name, phone, address, email).
-- WARNING: after this, the public /pedido tracking page (anon client, queries pedidos_detalle by
-- numero or telefono) stops working for anonymous visitors. It needs a server route
-- (service role, rate limited) before or together with applying this.

-- 1) The view runs with the caller's permissions, so RLS on pedidos/pedido_items applies.
alter view public.pedidos_detalle set (security_invoker = true);

-- 2) Remove direct anon access.
revoke select on public.pedidos_detalle from anon;

-- Admin dashboard keeps working: authenticated users still have access
-- (verify that RLS policies on pedidos/pedido_items allow authenticated reads).
