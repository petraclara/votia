# Votia

Votia is a production-oriented voting and ticketing platform for pageants, awards, talent shows, campus competitions and live events.

**Vote. Support. Celebrate.**

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- PostgreSQL + Prisma
- NextAuth credentials auth with `USER`, `ORGANIZER`, and `ADMIN` roles
- IntaSend checkout + webhook fulfilment for votes and tickets

## Setup

1. Copy environment variables:

```bash
copy .env.example .env
```

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

## IntaSend

Payments are initiated only on the server. Votes and tickets are **not** credited when a user clicks Pay.

1. Create a sandbox app at [IntaSend](https://intasend.com/).
2. Set `INTASEND_PUBLIC_KEY`, `INTASEND_SECRET_KEY`, and `INTASEND_TEST_MODE=true`.
3. In the IntaSend dashboard, add webhook URL:

`https://your-domain/api/webhooks/intasend`

4. Set `INTASEND_WEBHOOK_CHALLENGE` to the same challenge string.

The webhook:

- validates the challenge
- stores the payload
- verifies the invoice through the IntaSend status API
- checks amount and currency
- credits votes or tickets once, using an idempotent `processed` flag

The `/payment/success` page only displays a success state after the backend has marked the transaction as paid. It may call IntaSend again to reconcile a delayed webhook. It never trusts a frontend redirect on its own.

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

## Deployment

- Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and IntaSend keys.
- Point `NEXT_PUBLIC_APP_URL` at the public HTTPS origin.
- Configure the IntaSend webhook over HTTPS.
- Run `npx prisma migrate deploy` (or `db push`) before `npm run build`.
