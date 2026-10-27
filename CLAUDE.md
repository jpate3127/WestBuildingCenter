# West Building Center — working notes

Informational website + deal-alert texting for a family-owned lumber yard in Atlanta, MO. Most visitors are on a phone: design and test at 390 px first.

## Stack
Next.js 16 (App Router, React 19, server components by default) · TypeScript · Tailwind 4 · Prisma 7 + `@prisma/adapter-pg` on Postgres · better-auth (Google, allowlist) · Railway bucket via `@aws-sdk/client-s3` · Twilio and Resend through plain `fetch`.

## Commands
- `npm run db:local` — embedded Postgres for development (prints the DATABASE_URL in `.env.example`). Keep it running in its own terminal.
- `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm test`
- `npm run db:migration:new -- <name>` after a schema change (creates the SQL, does not apply) · `npm run db:migrate:deploy` applies. Railway runs `migrate deploy` on each deploy (see README).
- `npm run db:seed` — starter content; idempotent by slug.

## Layout of the code
- `prisma/schema.prisma` — 7 content tables + auth. **Extend an enum before adding a table.** Deer blinds and tool deals are both `CatalogItem`; every form is an `Inquiry`; texts and emails share one `Subscriber`.
- `src/lib/` — one file per concern: `db`, `auth`/`authz` (Google + allowlist; `requireAdmin()` in pages, `requireAdminAction()` in server actions), `storage` (bucket or `data/uploads`), `images` (sharp → `images/<id>.webp` + `.t.webp` thumb), `media` (URL helpers, client-safe), `sms`/`email` (providers), `subscribers` (sign-up, YES/STOP, confirm, unsubscribe), `broadcast` (send alert), `content` (owner-editable copy with defaults), `queries` (public read rules), `format`, `labels` (enum labels, client-safe), `site` (store facts), `hours`, `phone`, `slug`, `rateLimit`, `tokens`.
- `src/app/(site)/` — public pages, wrapped by `(site)/layout.tsx` (header, footer, sticky phone action bar).
- `src/app/admin/` — the owners' area; every page calls `requireAdmin()`; server actions live in `actions.ts` next to their page and call `requireAdminAction()`.
- `src/app/media/[...key]` serves uploads; `src/app/api/twilio/inbound` is the SMS webhook; `src/app/api/auth/[...all]` is better-auth.
- `src/components/ui.tsx` — the primitives (`Section`, `Container`, `Heading`, `Eyebrow`, `ButtonLink`/`Button`, `Badge`, `Field`, `Input`, `Textarea`, `Select`, `Notice`, `Honeypot`, icons). `src/components/site/` — public pieces (`cards.tsx`, `AlertSignupForm`, header/footer). `MediaImage` renders a stored image by key.

## Conventions
- Design tokens are Tailwind theme colors in `globals.css`: `brand` (red), `ink` (near-black), `cream` (projects section), `paper` (light gray), `line`, `muted`. Headings use the `display` class (Barlow Condensed, uppercase); small labels use `eyebrow`.
- Mobile first: 16 px gutters (`Container`), buttons ≥ 48 px tall, `tel:` links everywhere a phone number appears, no horizontal scroll at 390 px, grids collapse to 1–2 columns.
- Public pages read through `src/lib/queries.ts` so the "what is live" rules (published, within dates, ACTIVE status) live in one place.
- Forms: server actions with `zod`, the `Honeypot` field, `rateLimited()` per IP, and `useActionState` on the client. Never trust `formData` without parsing.
- Admin writes: validate with zod, then `revalidatePath("/")` plus the affected public path(s).
- Images: store keys only. `storeImage(file)` / `storePdf(file)` return the key; `mediaUrl(key)` / `thumbUrl(key)` build URLs; `removeStored(key)` deletes both variants.
- Dates are shown in America/Chicago via `src/lib/format.ts`. Store what the owner typed as end-of-day for end dates.
- Comments explain *why*, briefly; match the surrounding style.
- Run `npm run typecheck && npm run lint && npm test` before calling anything done.
