# GRANITOS

A granite slab inventory and billing system for a showroom business — tracks granite
types, purchased lots, customer sales, payments, and reporting.

## Tech Stack

- **Backend**: FastAPI + `psycopg2`
- **Database**: PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 13+

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then edit .env with your DB credentials
```

Initialize the database (create the database itself first — Postgres has no
`CREATE DATABASE IF NOT EXISTS`, so e.g. `createdb granitos` locally, or use
whatever database your hosted provider already created for you):

```bash
psql -U postgres -d granitos -f ../database/schema.sql
```

Run the dev server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env           # then edit .env if your API isn't on localhost:8000
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

**`backend/.env`**

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Full Postgres connection string (preferred — used by hosted providers like Neon/Supabase). Takes priority over the `DB_*` vars below if set. | *(unset)* |
| `DB_HOST` | Postgres host (fallback, local dev only) | `localhost` |
| `DB_PORT` | Postgres port (fallback) | `5432` |
| `DB_USER` | Postgres user (fallback) | `postgres` |
| `DB_PASSWORD` | Postgres password (fallback) | *(empty)* |
| `DB_NAME` | Database name (fallback) | `granitos` |
| `DB_SSLMODE` | SSL mode for the fallback connection | `prefer` |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:5173` |
| `LOG_LEVEL` | Python logging level (`DEBUG`/`INFO`/`WARNING`/`ERROR`) | `INFO` |

**`frontend/.env`**

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:8000` |

## Deployment Notes

For a step-by-step guide (recommended free-forever managed-hosting path, plus a
self-hosted VPS alternative), see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

- **Database**: run `database/schema.sql` against your production Postgres instance
  once. It's idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`), so
  re-running it is safe.
- **CORS**: set `CORS_ORIGINS` to include your production frontend URL, e.g.
  `CORS_ORIGINS=https://granitos.yourdomain.com`. You can list multiple origins
  comma-separated if you need both a staging and production frontend.
- **Backend process**: don't use `uvicorn --reload` in production. Run it under a
  process manager with multiple workers, e.g.:
```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
  Put it behind a reverse proxy (Nginx/Caddy) that terminates TLS — or, on a
  managed platform, let the platform terminate TLS for you and just bind to
  the `$PORT` it gives you (see `backend/Procfile`).
- **Frontend build**: `npm run build` produces static files in `frontend/dist/` —
  serve these from your reverse proxy or a static host.
- **Logging**: unhandled backend errors are logged (via Python's `logging` module,
  level controlled by `LOG_LEVEL`) and return a generic 500 to the client rather than
  a stack trace. Point your process manager's log capture at stdout/stderr.
- **Secrets**: never commit `.env` files — only `.env.example` is tracked.

## Known Limitations

- No row-locking on lot inventory during sale creation — under concurrent sales,
  two requests could theoretically both read the same `available_sqft` before either
  commits. Acceptable for current showroom transaction volume; revisit if that changes.
- No automated tests yet.
- No pagination on list views — fine at current data volume.
