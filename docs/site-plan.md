# West Building Center — High-Level Site Plan

_Draft 1 · 2026-10-24. See [research-brief.md](research-brief.md) for background._

## Goals, in priority order
1. **Promotions that reach people.** Post a Milwaukee (or any) promo PDF once. It goes on the site, and subscribers get a text and/or email with a link to it.
2. **Owner-editable.** Hours, text, promos, deer stands, and products can all be changed from an admin page. No developer or AI needed for content.
3. **Get found locally.** Name, address, phone, hours, and brands are clear and structured for Google.
4. **Grow B2B.** Give businesses an obvious way to ask for tool, bit, and consumable pricing (the Fastenal/Grainger alternative).
5. **Stay small.** One app, one database, a handful of tables, cheap hosting.

## Public site map

| Page | Purpose |
|---|---|
| **Home** | Current design is on the canvas. Order: event/announcement bar → red **deal-alert sign-up** hero → **Projects & Building** (farmhouse photo, what they do for projects, "Built with WBC" gallery with tag filters) → this month's Milwaukee flyer → **Top 6 picks** → hunting blinds → business quote + visit |
| **Projects & Building** `/projects` | The lumberyard side, meant to make WBC the place you *want* to go instead of the big box. Includes: start-a-project estimate form (upload plans or describe the job), what they do (materials lists from plans, special-order windows/doors/siding, kitchen & cabinet design help, job-site delivery), and the full **project gallery** filterable by tag (New homes, Siding, Kitchens & cabinets, Bath, Shops & pole barns, Outdoor living, Decks & railing). Customers can submit their own photos. Modeled on how regional yards like Spahn & Rose and 84 Lumber put "Projects & Plans" in their main menu |
| **Promotions** `/promotions` | Current promos as cards (image + dates). Past promos hidden or archived |
| **Promotion detail** `/promotions/[slug]` | Full PDF viewer + download, "call to order" button. **This is the page the texts link to** |
| **Hunting Blinds** `/blinds` | Muddy & Hawk box blinds on towers (currently $1,750–$3,950), photos from their own lot, specs, "installation available," "call to reserve/preorder." Also Tactacam cameras. Gets a home-page spotlight Jul–Nov |
| **Events** (part of Promotions) | Milwaukee Days, sales events, giveaways, with date, time and what's happening. Subscribers can be alerted the same way as promos |
| **Products & Brands** `/products` | Category overview (lumber, paint, doors/windows, electrical, plumbing, decking, cabinets) plus brand logos (Milwaukee, Fiberon, Aristokraft…). Not a full inventory |
| **For Businesses** `/business` | The industrial-supply pitch: competitive pricing on tools, bits, fasteners, consumables. "Request a quote" form where they paste a list or part numbers, plus "open a business account" |
| **About** `/about` | Family-owned since 2014, story, team photo, community (4-H, school, hunting tournament) |
| **Visit / Contact** `/contact` | Map, hours, phone, contact form |
| **Deal Alerts** `/alerts` | Sign up for text and/or email. Manage or unsubscribe at `/alerts/manage` |
| **Privacy** & **SMS Terms** | Required for carrier approval of texting (see below) |
| _Later / if confirmed:_ Rentals, Hunting Tournament, Events | Same content model as everything else (see "Pages & blocks") |

## Admin (`/admin`, Google sign-in)
- **Sign-in:** Google OAuth. Only email addresses on an **allowlist** get in, and everyone else is rejected even with a valid Google account. The owner can add or remove admins from the admin screen.
- **Built for a phone first.** They post from the counter today, so the admin has to be as quick as a Facebook post: snap a photo or attach the flyer, add a title, publish, done.
- **Dashboard:** subscriber count, active promos, new inquiries, and a one-line **announcement banner** editor ("Closed Saturday 11/18").
- **Promotions:** upload PDF (plus optional cover image), title, brand, start and end dates, and "Publish." Then "Send alert," with a preview of the text/email and the recipient count. Promos auto-hide after the end date.
- **Catalog items:** deer stands and featured products. Name, photo(s), price, description, category, active toggle.
- **Subscribers:** search, add (name, phone, email, channel), remove, export CSV. Shows each person's consent status and opt-out history.
- **Inquiries:** contact, B2B quote and project-estimate requests (with uploaded plans) in one inbox, with status (new, replied, closed).
- **Projects:** approve customer-submitted photos, add tags and a caption, feature one on the homepage. Garrett can also post his own straight from his phone.
- **Top 6 picks:** choose which deals show on the homepage. Each one is a `CatalogItem` with `featured` sort order, linked to the current flyer.
- **Site content:** edit the editable text blocks on each page (hero text, about text, hours, announcement banner).

## Architecture

**Match Gateway RipCo so there's one stack to maintain:** Next.js (App Router) + TypeScript + Tailwind + Prisma + better-auth, deployed on **Railway** from GitHub.

```
            ┌───────────── Railway service (one Next.js app) ─────────────┐
 Visitors ─►│  public pages (server-rendered, cached)                     │
 Owner ───► │  /admin  ── better-auth (Google OAuth + email allowlist)    │
            │  /api/webhooks/twilio  ◄── STOP/START/HELP replies          │
            │  Prisma ──► database                                        │
            │  file storage (promo PDFs, photos)                          │
            └──────────────┬──────────────────────────────┬───────────────┘
                           │                              │
                     Twilio (SMS)                  Email API (Resend/Postmark)
```

- **Database:** **Postgres on Railway** is my pick over SQLite. SQLite on a volume works, but Railway Postgres gives managed backups and zero-downtime deploys for about the same price. If you'd rather mirror Gateway RipCo exactly, SQLite plus a volume is fine at this scale. Your call.
- **Files:** Promo PDFs and photos go in **one storage bucket** (Railway bucket or Cloudflare R2, S3-compatible). Only the file key is stored in the database. No files go in git or the database.
- **Jobs:** A "Send alert" fans out to at most a few hundred people, so it can run in the request with a simple per-subscriber loop and a status record. No queue service needed.
- **Caching:** Public pages are rendered statically and revalidated when the admin saves, so they're fast and cheap.

## Data model — kept deliberately small

One table per real-world thing, no duplicate objects. Deer stands and Milwaukee tools are both **catalog items**, not separate tables. Contact forms and quote requests are both **inquiries**. Email and SMS subscribers are the same **subscriber**.

| Table | Key fields | Notes |
|---|---|---|
| `User` / `Session` / `Account` | (better-auth managed) + `role` | Admins only. Allowlist enforced on sign-in |
| `Promotion` | `kind` (`PROMO`/`EVENT`), `slug`, `title`, `brand`, `summary`, `pdfKey?`, `imageKey?`, `startsAt`, `endsAt`, `publishedAt` | Promos and events (Milwaukee Days) share one table, since both are "something time-boxed people get alerted about." "Active" is derived from dates, not stored |
| `CatalogItem` | `slug`, `name`, `category` (enum: `BLIND`, `TOOL`, `OUTDOOR`, `DECKING`, …), `description`, `priceCents?`, `priceNote?` ("call for price"), `stockNote?` ("4 left"), `badge?` ("$100 OFF"), `promotionId?` (the flyer it opens), `imageKeys[]`, `active`, `featured` (homepage Top 6), `sortOrder` | Covers blinds, featured in-stock deals ("5 back sprayers, $389"), and future rentals |
| `Subscriber` | `name`, `phone?`, `email?`, `smsStatus`, `emailStatus` (`PENDING`/`ACTIVE`/`STOPPED`), `consentSource` (`WEB`/`IN_STORE`/`PHONE`), `consentAt`, `manageToken` | One row per person. Channel status lives on the row, so there's no separate opt-out table |
| `Broadcast` | `promotionId`, `channel`, `message`, `sentAt`, `sentCount`, `failedCount`, `sentById` | One row per "Send alert" click, as an audit trail. Per-message delivery detail stays in Twilio and the email provider's logs instead of being copied here |
| `Inquiry` | `type` (`CONTACT`/`QUOTE`/`ACCOUNT`/`PROJECT_ESTIMATE`), `name`, `company?`, `phone?`, `email?`, `message`, `fileKeys[]` (uploaded plans), `status` | One inbox for every form, including "start a project estimate" with plan uploads |
| `Project` | `title`, `tags[]` (enum: `NEW_HOME`, `SIDING`, `KITCHEN`, `BATH`, `SHOP_BARN`, `OUTDOOR`, `DECK`, …), `caption`, `materials?` ("LP SmartSide, Wolf cabinets"), `imageKeys[]`, `status` (`SUBMITTED`/`PUBLISHED`/`HIDDEN`), `submittedBy?` (name/phone), `featured`, `sortOrder` | The gallery. A customer's "share your project" upload creates a `SUBMITTED` row directly (no separate submissions table), and Garrett tags and publishes it |
| `ContentBlock` | `key` (e.g. `home.hero`, `about.story`, `store.hours`, `site.banner`), `value` (text/markdown) | Owner-editable copy. Store facts (hours, phone, address) live here once and render everywhere: header, footer, contact page, Google structured data |

That's **7 tables plus auth.** New features should extend these (a new `category` value, a new `Inquiry.type`) before adding tables.

## Promo alert flow

```
Owner uploads PDF → Promotion published → page live at /promotions/milwaukee-fall-2026
        │
        └─ clicks "Send alert" → preview → confirm
              ├─ SMS (subscribers with smsStatus=ACTIVE):
              │    "West Building Center: New Milwaukee deals through 11/30 → wbc.link/p/… Reply STOP to opt out"
              └─ Email (emailStatus=ACTIVE): cover image + button + one-click unsubscribe
        Broadcast row records counts.
```

### Subscribing & unsubscribing
- **Web sign-up** (`/alerts`): name, phone and/or email, and a consent checkbox with the required wording. SMS sign-ups get a **confirmation text ("Reply YES to confirm")** (double opt-in), and email gets a confirm link. Status stays `PENDING` until they confirm.
- **Owner adds someone at the counter or by phone:** the record is created as `PENDING` with `consentSource=IN_STORE`, and the system sends the same "Reply YES" text. This keeps the owner covered legally without extra work. They just type the number.
- **Opting out:** replying **STOP** is handled by Twilio. Our webhook sets `smsStatus=STOPPED`, and START re-subscribes. Every email has an unsubscribe link plus the one-click `List-Unsubscribe` header. `/alerts/manage?token=…` lets people change channels. Admins can also remove anyone.

### Texting compliance (the long pole, so start early)
- US carriers require **A2P 10DLC registration** for business texting from a regular local number: a **brand** (legal name + EIN) and a **campaign** (use case = marketing, sample messages, opt-in description).
- Approval typically takes **days to a few weeks** and requires a **live website** showing the opt-in form, a privacy policy, and SMS terms. So the site needs to launch first, then texting goes live.
- An alternative is a **toll-free number** with toll-free verification, which is often simpler for low-volume senders. We'll decide when registering.
- Costs are small: a phone number is about $1–2/mo, plus registration fees and roughly a cent per text. A few hundred subscribers × a few promos a month comes to a few dollars a month. **(Verify current Twilio pricing at signup.)**
- Federal law (TCPA) needs **express written consent** for marketing texts. That's what the checkbox wording plus the YES confirmation provide, with the timestamp stored on the subscriber.

## Future ideas (not in v1)
- **B2B quoting:** turn quote inquiries into a simple quote builder or saved customer price lists.
- **Supplier automation:** once we know their distributors (Do it Best, Orgill, Emery Jensen, Milwaukee direct…), look at what each offers: EDI, dealer portals with order or price-file exports, or APIs. Likely first win: **import distributor price files** to keep catalog prices current, and **auto-pull new promo flyers** from the dealer portal.
- **Short link domain** for texts (e.g. `wbc.link`).
- **"Share to Facebook" button** on each promo, so one upload feeds the website, alerts and Facebook.
- **Milwaukee Days RSVP / giveaway entry** form (would reuse `Inquiry` with a new type).
- **Google Business Profile** posts generated automatically from each new promotion.

## Build phases
1. **Foundation:** repo, Next.js app, Railway deploy, domain, public pages with placeholder content, Google admin login.
2. **Content admin:** content blocks and banner, catalog items (blinds, top 6 picks), promotions and events with PDF/image upload, project gallery with tags and customer submissions.
3. **Alerts:** subscriber sign-up and management, email sending, then SMS once 10DLC is approved.
4. **B2B and polish:** business page plus quote requests, SEO structured data, analytics, Google Business Profile.
