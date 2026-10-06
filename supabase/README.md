# supabase/

SQL files for the owner to apply manually in the Supabase SQL editor. Nothing here runs automatically.

| Order | File | When to run |
| --- | --- | --- |
| 1 | `audit/export_schema_and_policies.sql` | First, any time. Read-only queries: policies, grants, triggers (query 8 checks for a stock trigger that would double-decrement). Review the output before step 2. |
| 2 | `fixes/pedidos_detalle_privacy.sql` | AFTER deploying branch `fix/payment-security` (public tracking now goes through `/api/seguimiento`). Sets `security_invoker` on `pedidos_detalle` and revokes anon access. Idempotent. |
| optional | `migrations/20261006000000_crear_pedido_rpc.sql` | Transactional order RPC. Not wired into the code yet; apply only if you plan to switch `/api/pedidos` to it. |
