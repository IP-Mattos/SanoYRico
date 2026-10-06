# Feature: payment-security-hardening

Branch: `fix/payment-security`

## Objective
Stop price tampering, harden the Mercado Pago webhook, and validate stock in the public order flow, without changing UI copy or design.

## Problem / Why
- `POST /api/pedidos` trusts client-sent `precio`; any product can be bought at $0.01.
- `POST /api/mp/create-preference` builds the MP preference from client items/prices and writes `mp_preference_id` onto any order id.
- The webhook fails open without a secret, compares HMAC with `===`, does not verify amount/currency/state, and is rate-limited by the proxy.

## Constraints
- No UI copy/design changes. Spanish identifiers (project convention).
- No remote DB DDL is possible from this machine (no DB URL / CLI / management token): SQL goes to `supabase/` as files for the owner to apply.
- The MP token in `.env.local` is PRODUCTION: no sandbox payment check from here.
- No push/deploy without owner OK. No AI attribution in commits.

## Decisions
- A rejected/cancelled payment does NOT cancel the order (MP lets buyers retry within the same preference). Only `pendiente -> confirmado` on approved is automatic.
- Stock: validated at creation; decremented on `pendiente -> confirmado` via conditional update (`estado = 'pendiente'`), so duplicate webhooks cannot double-decrement. (Writer must confirm no existing trigger/flow already decrements.)

## Tasks
- [x] T1 Server-side pricing/validation (`/api/pedidos`) + unit tests (vitest) — route: delegated
- [x] T2 `create-preference` loads order + items from DB, payable-state guard — route: delegated
- [x] T3 Webhook hardening (fail closed, timingSafeEqual, amount/currency/ref check, state guard, idempotency) + unit tests — route: delegated
- [x] T4 Proxy: exclude `/api/mp/webhook` from rate limiting — route: delegated
- [x] T5 Stock check at creation + decrement on confirmation — route: delegated
- [x] T6 `supabase/` SQL: transactional order RPC, view/RLS fix, audit queries — route: delegated
- [ ] T7 (test/lint/build run by writer, parent re-verifies)   `pnpm lint`, `pnpm test`, `pnpm build` green

Route evidence: 4+ non-trivial files -> writer trigger fired; one delegated writer.

## P2 findings (observed 2026-10-06, anon key, count-only HEAD requests)
- `pedidos_detalle`: anon sees 10/10 rows (full PII exposure). `pedidos`, `pedido_items`: anon sees 0.
- Auth settings: `disable_signup: false`, `mailer_autoconfirm: false` -> anyone can sign up and become "admin".

## Progress / Evidence
Writer pass (working tree, uncommitted):
- T1: `src/lib/pedidos/cotizar.ts` (pure) + `/api/pedidos` reads `productos` (id,nombre,emoji,precio,stock,activo) and `configuracion.general.minimoPedido` (fallback DEFAULT_CONFIG) with the service role. Client `total` ignored.
- T2: `create-preference` takes only `pedido_id` (UUID regex); 404/409 guards; items/payer/back_urls from DB; conditional save `.is('mp_preference_id', null)`. Cart.tsx now posts only `{pedido_id}`.
- T3: `src/lib/mp/firma.ts` (timingSafeEqual), `src/lib/mp/decidir-transicion.ts`; webhook fails closed (500) without secret in production; conditional update `estado='pendiente'`.
- T4: proxy skips generic API rate limit for `/api/mp/webhook`.
- T5 decision: no code, dashboard or SQL in the repo decrements stock on confirmation/delivery (dashboard pedidos page only updates `estado`; stock changes only via dashboard/stock manual adjustments). DB triggers cannot be verified from the repo (audit query 8 checks). Decrement added ONLY in the webhook winning branch (optimistic `.eq('stock', leido)`, 3 tries, logs on failure, writes `movimientos_stock` salida). Gap: manual confirmation of transferencia/deposito orders in the dashboard still does not decrement stock. If a DB trigger exists, this causes a double decrement: check before deploy.
- T6: SQL files under `supabase/` (not executed).
- Tests: vitest, 27 tests; RED observed (modules missing) before implementation.

Checks: pnpm test 27/27 pass; pnpm build pass; pnpm lint: 2 pre-existing errors (CartToast.tsx:18 react-hooks/purity, Navbar.tsx:24 set-state-in-effect), none in touched files.

## Next step
Parent: review diff, confirm no DB stock trigger, commit work units.
