# Votia

Votia is a production-oriented voting and ticketing platform for pageants, awards, talent shows, campus competitions and live events.

**Vote. Support. Celebrate.**

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- PostgreSQL + Prisma
- NextAuth credentials auth with `USER`, `ORGANIZER`, and `ADMIN` roles
- Safaricom Daraja M-Pesa STK Push + callback fulfilment for votes and tickets

## Setup

1. Copy environment variables:

```bash
copy .env.example .env
```

Use `.env.local` for local secrets if you prefer. Do not commit real Daraja credentials.

2. Start PostgreSQL. Docker Desktop must be running first.

Votia uses host port **5434** so it does not clash with other local Postgres containers on 5432:

```bash
docker compose up -d
```

3. Install dependencies, generate the client, run migrations, and seed mock events:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

If you prefer a quick local schema sync instead of migrations:

```bash
npx prisma db push
npm run db:seed
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

- Admin: `admin@votia.co.ke` / `Admin123!`
- Organizer: `organizer@votia.co.ke` / `Organizer123!`

## Daraja (M-Pesa STK Push)

Payments are initiated only on the server. Votes and tickets are **not** credited when STK Push is merely started.

1. Create a sandbox app in the [Safaricom Daraja portal](https://developer.safaricom.co.ke/) and enable **Lipa Na M-Pesa Online**.
2. Copy your **Consumer Key** and **Consumer Secret** into `.env` / `.env.local` (never commit them).
3. The portal often shows Passkey / Short Code as **N/A** in sandbox. Use Safaricom’s public Lipa Na M-Pesa Online sandbox test values locally (these are published test values, not your production secrets):

```text
DARAJA_CONSUMER_KEY=your_key
DARAJA_CONSUMER_SECRET=your_secret
DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
DARAJA_SHORTCODE=174379
DARAJA_ENV=sandbox
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

4. Callback URL (server-only) — **required for STK Push**:

Safaricom rejects `http://localhost` as `CallBackURL` (`400.002.02 Invalid CallBackURL`).

- Keep the app on `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Set a separate public HTTPS callback:

```text
DARAJA_CALLBACK_URL=https://your-tunnel-or-vercel-host/api/webhooks/daraja
```

Quick local tunnel (while `npm run dev` is running):

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Copy the `https://….trycloudflare.com` URL into `DARAJA_CALLBACK_URL` (append `/api/webhooks/daraja` if you only paste the origin), restart `npm run dev`, then pay again.

If you already have Votia on Vercel with the same database, you can point `DARAJA_CALLBACK_URL` at:

`https://your-app.vercel.app/api/webhooks/daraja`

Payment confirmation on localhost still works via **STK Query polling** on `/payment/success` even when the callback is delayed.

5. Optional:

```text
DARAJA_TRANSACTION_TYPE=CustomerPayBillOnline
DARAJA_PARTY_B=
DARAJA_CALLBACK_URL=
```

Switching to production: set `DARAJA_ENV=production`, your live Consumer Key/Secret, Go-Live shortcode + passkey, and `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` to the Vercel HTTPS origin. Remove or update `DARAJA_CALLBACK_URL` so it points at production.

### Fulfilment rules

- Create a `PENDING` payment row first, then initiate STK Push
- Store `CheckoutRequestID` immediately
- Credit after a verified successful callback **or** a successful STK Query (`ResultCode = 0`)
- Prefer the real M-Pesa receipt from the callback when present
- Amount is always checked against the server-stored expected amount
- Idempotent `processed` flag prevents double-crediting
- Cancelled / failed / timeout / insufficient-funds codes mark the payment without crediting
- `/payment/success?ref=...` polls status until `PAID`, `FAILED`, `CANCELLED`, or timeout

Sandbox tip: use Safaricom’s published test MSISDN for STK simulator flows (commonly `254708374149`).

## Images (Cloudinary)

Event `poster` / `banner` and contestant `image` store a public URL string in PostgreSQL.

Uploads go through `POST /api/upload` (approved organizers / admins only) and are stored in **Cloudinary**.

Set these server-only env vars (never expose the API secret to the client):

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=votia
```

On Vercel these are required. Locally, if they are omitted, uploads fall back to `public/uploads` (not durable across deploys).

## Organizer approval (local test)

Production always requires admin approval. To test locally:

1. Register at `/register` (organizer starts `PENDING`)
2. Log in as seeded admin `admin@votia.co.ke` / `Admin123!`
3. Approve the organizer at `/admin`
4. Use the organizer account — JWT refreshes approval from the DB (no special bypass)

## Routes

- `/` homepage
- `/events` and `/events/[slug]`
- `/events/[slug]/contestants/[contestantSlug]`
- `/vote` live voting
- `/tickets`
- `/about` `/contact`
- `/login` `/register`
- `/dashboard` organizer tools
- `/admin` platform admin (approve organizers, disable events, revenue)

## Deployment (Vercel)

Set these on Production, Preview, and Development. Do not leave `DATABASE_URL` or `NEXTAUTH_SECRET` empty.

Required:

```text
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
DARAJA_CONSUMER_KEY=
DARAJA_CONSUMER_SECRET=
DARAJA_PASSKEY=
DARAJA_SHORTCODE=
DARAJA_ENV=sandbox
DARAJA_CALLBACK_URL=https://YOUR_DOMAIN/api/webhooks/daraja
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Keep `DARAJA_ENV=sandbox` until live Safaricom credentials are provided. Then set `DARAJA_ENV=production` and replace shortcode/passkey with Go-Live values.

- Run `npx prisma migrate deploy` before or during deploy
- `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` must be the public HTTPS origin (not localhost) in Vercel
- Localhost: keep both on `http://localhost:3000` and use STK Query polling; set `DARAJA_CALLBACK_URL` only if you have a public HTTPS tunnel
