-- ============================================================================
-- RUN AFTER deploying branch fix/payment-security.
-- Not executed automatically: the owner applies this in the Supabase SQL editor.
--
-- Why after: the public /pedido page now reads through GET /api/seguimiento (service role,
-- rate limited, PII masked) instead of querying pedidos_detalle with the anon key. Running this
-- BEFORE the deploy breaks order tracking for visitors.
--
-- Finding: anon could read every row of pedidos_detalle (name, phone, address, email).
-- Idempotent: safe to run more than once.
-- ============================================================================

-- 1) The view runs with the caller's permissions, so RLS on pedidos/pedido_items applies.
alter view public.pedidos_detalle set (security_invoker = true);

-- 2) Remove direct anon access to the view and to the base tables.
--    (Anon already sees 0 rows in pedidos/pedido_items via RLS; this removes the grant as well.
--    Public order creation uses the service role in /api/pedidos and is not affected.)
revoke all on public.pedidos_detalle from anon;
revoke all on public.pedidos from anon;
revoke all on public.pedido_items from anon;

-- Admin dashboard keeps working: the authenticated role is untouched.
-- Verify that the RLS policies on pedidos/pedido_items allow authenticated reads.
-- Existing policies are NOT dropped here (they cannot be reviewed from the repo): run
-- supabase/audit/export_schema_and_policies.sql first and review them.
