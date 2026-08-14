# Supabase (Postgres)

Supabase can replace **Postgres only** in this stack. You still need **Redis** (job queue) and a place to run the **API + worker** (Oracle VM, Fly.io, etc.).

Supabase does **not** replace:
- Redis / BullMQ (use Upstash free, or Redis on your Oracle VM)
- Playwright worker (must run on a VM/container)

---

## What works today

| Supabase feature | Used by LSO? |
|------------------|--------------|
| **Postgres database** | Yes — set `DATABASE_URL` |
| Auth | Not yet (deferred) |
| Storage | Not yet (reports stay on disk) |
| Realtime | Not used |

---

## Setup (5 min)

1. https://supabase.com → create project (free tier)
2. **Project Settings → Database → Connection string → URI**
3. Copy the **Session pooler** or **Direct** URI (not Transaction pooler for migrations)

Example:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

Add SSL if not in the string:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

4. Run migrations once (from any machine with the repo):

```bash
export DATABASE_URL='postgresql://...'
pnpm db:migrate
```

Or let the cloud container run `pnpm db:migrate` on startup (Oracle / Fly deploy).

---

## Option B — Oracle VM + Supabase

Run **app + Redis** on Oracle; use Supabase for Postgres instead of the Docker Postgres container.

1. Create Supabase project → copy `DATABASE_URL`
2. On Oracle VM, skip the `postgres` service — use `docker-compose.oracle-supabase.yml` (see repo) or set env on the `app` service only:

```bash
export DATABASE_URL='postgresql://...supabase...?sslmode=require'
export REDIS_URL='redis://redis:6379/0'
export POSTGRES_PASSWORD='unused'
docker compose -f docker-compose.oracle-supabase.yml up -d --build
```

3. Phone **Settings** → `http://YOUR_ORACLE_IP:3001`

**Why bother?** Managed backups, dashboard, and you can inspect crawl/audit data in Supabase Table Editor.

---

## Fly.io + Supabase + Upstash ($0)

Same as the Fly guide, but use Supabase instead of Neon:

```bash
fly secrets set \
  DATABASE_URL="postgresql://...supabase...?sslmode=require" \
  REDIS_URL="rediss://...upstash..."
fly deploy
```

---

## Pooler notes

- **Migrations:** use **Direct** or **Session** connection (port 5432)
- **Transaction pooler** (port 6543) can break Drizzle migrations — avoid for `pnpm db:migrate`

---

## Free tier limits

Supabase free: 500 MB database, 2 projects, pauses after 1 week inactivity on some plans — check current Supabase pricing. Fine for personal / demo use.
