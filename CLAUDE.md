# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (lockfile + `pnpm-workspace.yaml` with built-deps allowlist for `sharp`/`unrs-resolver`).

- `pnpm dev` — Next.js dev server on `http://localhost:3000` (Turbopack by default in Next 16)
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint (flat config at [eslint.config.mjs](eslint.config.mjs), extends `eslint-config-next/core-web-vitals` + `typescript`)

No test suite is configured. The repo is Spanish-first (rioplatense): identifiers, routes, DB columns and UI copy are all in Spanish — preserve that when adding code.

## Architecture

Next.js 16 App Router on Vercel, Tailwind 4, React 19, TypeScript strict, single Supabase backend for DB + Storage + Auth, Resend for transactional email, Mercado Pago for checkout, Replicate for AI image processing.

Path alias `@/*` → `src/*`.

### Edge proxy (not middleware)

Next 16 renamed the `middleware` file to `proxy`. The edge logic lives at [src/proxy.ts](src/proxy.ts) — **do not create a `middleware.ts`**. It handles three things in order:

1. **In-memory rate limits** (per-instance Map, not Redis — flagged in the file as a multi-instance limitation). Buckets: `api:<ip>` 20/min, `pedidos:<ip>` 5/hour on `/api/pedidos` POST, `login:<ip>` 10 / 15min.
2. **Supabase SSR session** via `@supabase/ssr` cookies — the response must be the one returned by `createServerClient`'s `setAll` callback, hence the `supabaseResponse = NextResponse.next(...)` reassignment pattern. Preserve that flow.
3. **Auth gates**: redirects unauthenticated users off `/dashboard`, redirects logged-in users off `/login`, and returns 401 for a specific list of protected APIs. `/api/pedidos` root is **public** (customers post orders without auth); the `PROTECTED_APIS` list uses `/api/pedidos/` with a trailing slash on purpose so only sub-routes (`[id]/confirmar-email`, `[id]/notificar`) require a session. Keep that distinction if you add routes under `/api/pedidos/…`.

### Two Supabase clients, by design

- **Browser/anon** — [src/lib/supabase.ts](src/lib/supabase.ts) `createClient()` via `@supabase/ssr`'s `createBrowserClient`. Used by all `'use client'` pages (landing, dashboard). Subject to RLS.
- **Server service-role** — inline `createClient(URL, SUPABASE_SERVICE_ROLE_KEY)` from `@supabase/supabase-js` inside API route handlers ([src/app/api/pedidos/route.ts](src/app/api/pedidos/route.ts), the MP routes, the cron, `remove-bg`). **Bypasses RLS** — required because the public order flow inserts into `pedidos` without a session. Never import the service-role client from a client component.

### Surfaces

- **Public landing** — [src/app/page.tsx](src/app/page.tsx) is an async RSC with `export const revalidate = 60` (ISR). It fetches site config server-side via `getSiteConfig()` then hands it to the `CartProvider` tree. All landing sub-components under [src/components/landing/](src/components/landing/) are client components that talk to Supabase directly (anon key + RLS).
- **Checkout / order tracking** — `/pedido` (client page, reads from the `pedidos_detalle` view).
- **Admin dashboard** — [src/app/dashboard/](src/app/dashboard/) with a client-side layout ([src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx)) that: (a) verifies session via `supabase.auth.getUser()` and pushes to `/login` on failure, (b) subscribes to Supabase Realtime on the `pedidos` table to keep the "pendientes" badge live, (c) shows a "pedidos >2h sin confirmar" banner. Sections: `productos`, `categorias`, `stock`, `ventas`, `ganancias`, `pedidos`, `contenido`.
- **Auth** — `/login` uses `signInWithPassword`. There is no sign-up flow; admin users are provisioned directly in Supabase.

### Editable site content

Landing copy/configuration is not hardcoded — it's stored in the `configuracion` table as `{clave, valor}` rows. [src/lib/site-config.ts](src/lib/site-config.ts) defines `DEFAULT_CONFIG` (the fallback/shape) and `getSiteConfig()` (fetches and merges rows over defaults). The admin edits it from [src/app/dashboard/contenido/page.tsx](src/app/dashboard/contenido/page.tsx), which upserts rows by `clave` and then calls the server action [src/app/actions/revalidate.ts](src/app/actions/revalidate.ts) — `revalidatePath('/')` — to invalidate the ISR cache. If you add a new top-level key to `SiteConfig`, add it to `DEFAULT_CONFIG` with sane defaults; the merge relies on `clave in merged`.

### Orders pipeline

Public POST `/api/pedidos` ([src/app/api/pedidos/route.ts](src/app/api/pedidos/route.ts)) is the only unauthenticated write endpoint. It:

1. Sanitizes all string fields (`clean()` trims/slices/strips `<>`).
2. Recomputes the total from items and **rejects** if the client-declared total diverges by more than $1 (anti-tampering).
3. Inserts `pedidos` + `pedido_items`, deletes the parent on child-insert failure (no DB-level transaction — this manual rollback is intentional for the Supabase REST client).
4. Fires emails to admin (`ADMIN_EMAIL`) and optionally to the customer in the background (`.catch(console.error)`), so email failure never fails the order.

Order state machine is `pendiente → confirmado → entregado | cancelado`. Transitions happen either in the dashboard (manual), via the MP webhook, or via `/api/pedidos/[id]/notificar` which also emails the customer via [src/lib/email.ts](src/lib/email.ts).

### Mercado Pago

- `/api/mp/create-preference` builds a preference server-side with `external_reference = pedido.id` and stores `mp_preference_id` on the order. It switches between `init_point` (prod) and `sandbox_init_point` based on whether the access token starts with `TEST-`.
- `/api/mp/webhook` validates the `x-signature` HMAC-SHA256 (manifest format `id:<data.id>;request-date:<ts>;uid:<x-request-id>;` + secret `MERCADOPAGO_WEBHOOK_SECRET`). If the secret env is unset the check is skipped — intentional for local dev, so keep that short-circuit. Approved → `confirmado`, rejected/cancelled → `cancelado`, pending is a no-op.
- Return pages live under `/mp/{success,failure,pending}`.

### AI image pipeline (`/api/remove-bg`)

Two-step Replicate flow (admin-only): `flux-kontext-apps/kontext-emoji-maker` → generic `remove-bg` model (pinned version `95fcc2a2…`) → upload to the public Supabase Storage bucket `productos`. `replicatePost()` retries on HTTP 429 using `retry_after`, and `waitForPrediction()` polls up to 90s if the `Prefer: wait` header didn't resolve synchronously. Input guard: 10 MB max, JPG/PNG/WebP only.

### Cron

[vercel.json](vercel.json) registers `/api/cron/recordar-pendientes` at `0 17 * * *`. The handler ([src/app/api/cron/recordar-pendientes/route.ts](src/app/api/cron/recordar-pendientes/route.ts)) checks `Authorization: Bearer ${CRON_SECRET}` — don't invoke it from the browser.

### Cart

[src/context/CartContext.tsx](src/context/CartContext.tsx) persists to `localStorage` under key `sano-carrito`. The `montado` ref guard is deliberate — it prevents the first effect from overwriting storage with an empty array before the load effect runs (hydration-safe).

### Data model reference

Tables the code reads/writes: `productos`, `categorias`, `pedidos`, `pedido_items`, `ventas`, `ventas_manuales`, `movimientos_stock`, `configuracion`. Views: `pedidos_detalle` (used by both public `/pedido` and admin pedidos page), `stock_bajo` (dashboard summary). Types in [src/lib/types.ts](src/lib/types.ts) mirror table shapes — update both together.

### Required environment

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `REPLICATE_API_TOKEN`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`.

### Security headers & images

[next.config.ts](next.config.ts) sets `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, and a restrictive `Permissions-Policy`. Only `*.supabase.co/storage/v1/object/public/**` is allow-listed for `next/image` — product images must live there (the `/api/remove-bg` upload target is the `productos` bucket, which satisfies this pattern).
