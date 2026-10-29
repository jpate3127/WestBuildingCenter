# West Building Center

Website and deal-alert texting for West Building Center, a family-owned lumber yard in Atlanta, Missouri.

- **Public site:** homepage, Projects & Building (gallery + estimate form), Milwaukee deals (flyer pages the texts link to), hunting blinds, products, for businesses (quote), about, contact, deal-alert sign-up/manage/unsubscribe, privacy, SMS terms.
- **Admin** (`/admin`, Google sign-in, allowlist): promotions and events with "Send alert", deals and blinds (incl. the homepage Top 6), project gallery with customer submissions, subscribers (add at the counter, CSV export), inbox for every form, editable page copy and hours, admin list.
- **Stack:** Next.js 16 · TypeScript · Tailwind 4 · Prisma 7 on Postgres · better-auth (Google) · Railway bucket for uploads · Twilio (texts) · Resend (email). Same shape as Gateway RipCo's live site.

Design and research: `docs/site-plan.md`, `docs/research-brief.md`. Working notes for development: `CLAUDE.md`.

## Run it locally

```bash
npm install
cp .env.example .env        # fill in what you have; blanks are fine to start
npm run db:local            # embedded Postgres in its own terminal (keep it running)
npm run db:migrate:deploy   # create the tables
npm run db:seed             # starter content and WBC photos
npm run dev                 # http://localhost:3000 (or the next free port)
```

`ADMIN_EMAILS` plus Google credentials are needed to open `/admin`. Texts and email are off until Twilio/Resend are configured; the site still runs, and the admin dashboard shows what is missing.

Checks: `npm run typecheck && npm run lint && npm test`. Build: `npm run build`.

## Going live on Railway

One Railway project holds three things: the **Postgres** database, a storage **bucket** for uploads, and the **website**. Push to the GitHub repo's main branch and the website redeploys itself (migrations run first). If the service shows "Auto deploy unavailable", press Ctrl+K in Railway and run **Deploy latest commit**.

### 1. Accounts (one time)

1. **GitHub:** push this folder to a new repo (`git remote add origin …`, `git push -u origin main`).
2. **Railway** (railway.com): sign in with GitHub, Hobby plan.
3. **Google sign-in:** console.cloud.google.com → new project "West Building Center" → *APIs & Services → OAuth consent screen* (External, app name, your email, default scopes, publish) → *Credentials → Create OAuth client ID → Web application*. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` now, and the live one (`https://<your-domain>/api/auth/callback/google`) once you have a domain. Copy the Client ID and Secret.

### 2. Database and bucket

1. Railway → **New Project → Empty project**, name it `west-building-center`.
2. **Create → Database → PostgreSQL.** Leave the name `Postgres`. (Optional, for running scripts from a PC: Settings → Networking → enable TCP Proxy; `DATABASE_PUBLIC_URL` is then your PC's `DATABASE_URL`.)
3. **Create → Bucket**, name `uploads`. Open its **Credentials** tab; you'll reference these values next.

### 3. The website

1. **Create → GitHub Repo** → pick this repo (if it is not listed, paste the repo URL into the search box). Railway no longer reads `railway.json` for new services, so set these under Service → **Settings**: Build command `npm run build`, Pre-deploy command `npm run db:migrate:deploy`, Start command `npm run start`, Healthcheck path `/`. `package.json` pins Node 22; without it the builder picks Node 18, which Next 16 cannot run on.
2. Service → **Variables** → add (Raw Editor is fastest):

   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   SITE_URL=https://<your-railway-domain-or-custom-domain>
   BETTER_AUTH_URL=${{SITE_URL}}
   BETTER_AUTH_SECRET=<openssl rand -base64 32>
   GOOGLE_CLIENT_ID=…
   GOOGLE_CLIENT_SECRET=…
   ADMIN_EMAILS=garrett@…, joey.j.pate@gmail.com
   BUCKET_ENDPOINT=${{uploads.ENDPOINT}}
   BUCKET_NAME=${{uploads.BUCKET}}
   BUCKET_ACCESS_KEY_ID=${{uploads.ACCESS_KEY_ID}}
   BUCKET_SECRET_ACCESS_KEY=${{uploads.SECRET_ACCESS_KEY}}
   BUCKET_REGION=${{uploads.REGION}}
   PORT=8080
   TZ=America/Chicago
   ```

   (The `${{uploads.*}}` names come from the bucket's Credentials tab; if it says path-style, also set `BUCKET_FORCE_PATH_STYLE=true`.)
3. Service → **Settings → Networking → Generate Domain** to get a `*.up.railway.app` URL first; set `SITE_URL` to it, redeploy, and add that URL's callback to the Google OAuth client. Switch to the real domain later (step 5).
4. Open `https://<domain>/admin`, sign in with an email from `ADMIN_EMAILS`.
5. **Starter content:** the site starts empty. To load the seed (current flyer, picks, blinds, projects) once: on your PC set `DATABASE_URL` to `DATABASE_PUBLIC_URL` and the `BUCKET_*` values in `.env`, then `npm run db:seed`. Or just add things in the admin.

### 4. Texts (Twilio) and email (Resend)

Texting to US numbers from a business requires carrier registration. It takes days to a few weeks, and the website must be live first (the registration form asks for the sign-up page and SMS terms: `/alerts` and `/sms-terms`).

1. twilio.com → create an account → **Messaging → Regulatory compliance → A2P 10DLC**: register the **brand** (legal business name, EIN, address) and a **campaign** (use case "Marketing"; description: deal alerts customers opted into on the website or at the counter; sample messages: the text in `src/lib/subscribers.ts`; opt-in: website form with checkbox + YES confirmation, and in-store with YES confirmation).
2. Buy a local Missouri number (or use a toll-free number with toll-free verification, which is often faster for low volume). Create a **Messaging Service**, add the number, attach the campaign.
3. Messaging Service → Integration → "Send a webhook": `https://<domain>/api/twilio/inbound` (that handles YES/STOP/HELP). Leave Twilio's built-in STOP handling on.
4. Railway variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`.
5. resend.com → add and verify the sending domain → API key. Railway variables: `RESEND_API_KEY`, `EMAIL_FROM="West Building Center <deals@<domain>>"`.

Until these are set, sign-ups are stored (status "pending") and the admin can still see them; nothing is sent.

### 5. Domain

Register `westbuildingcenter.com` (and `.org`, pointing to the same place) in an account the business controls, auto-renew on. Railway service → Settings → Networking → Custom Domain → add the domain, then create the CNAME it shows at the registrar. Update `SITE_URL`, the Google OAuth redirect URI, and the Twilio webhook URL.

## Day to day

- **Schema change:** edit `prisma/schema.prisma`, then `npm run db:migration:new -- <name>` (writes the SQL under `prisma/migrations/`, does not apply). Commit it; Railway applies it on the next deploy. Locally: `npm run db:migrate:deploy`.
- **Backups:** Railway Postgres has a Backups tab (enable daily). Uploads live in the bucket.
- **Logs:** Railway service → Deployments → View logs. Send-alert failures show in the admin on the promotion page and in the logs.
