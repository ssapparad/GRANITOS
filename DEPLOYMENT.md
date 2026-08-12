# Deploying GRANITOS

You're starting from scratch (no server or domain yet), so this guide uses two
managed platforms with generous free tiers — no server administration required:

- **Railway** — hosts the FastAPI backend + MySQL database
- **Vercel** — hosts the built React frontend as a static site

Total cost to start: **$0**. Railway's free trial credit covers a small app like
this for a while; once it runs out, the backend + database together usually land
in Railway's ~$5/month "Hobby" range. Vercel's free tier is enough for the
frontend indefinitely at this traffic level.

If you'd rather run everything on your own VPS instead, skip to
[Alternative: self-hosted VPS](#alternative-self-hosted-vps) — that path is
already documented in `README.md`.

---

## 0. Push the code to GitHub

Both Railway and Vercel deploy by connecting to a GitHub repo.

```bash
cd GRANITOS-risky-experiment
git init
git add .
git commit -m "Initial commit"
```

Create a new **empty** repo on [github.com/new](https://github.com/new) (don't
add a README/license there), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

A `.gitignore` is already included so `node_modules/`, `__pycache__/`, `.env`
files, and build output won't be committed.

---

## 1. Database + backend on Railway

1. Go to [railway.app](https://railway.app) and sign up (GitHub login is easiest).
2. **New Project → Provision MySQL.** This creates a managed MySQL instance and
   a `MySQL` service in your project.
3. **Initialize the schema.** Open the MySQL service → **Data** tab → **Query**,
   and paste in the full contents of `database/schema.sql` from this repo, then
   run it. (Alternatively, connect with the `mysql` CLI using the connection
   details from the service's **Connect** tab and run
   `mysql -h <host> -P <port> -u <user> -p <database> < database/schema.sql`.)
4. Back in the project, click **+ New → GitHub Repo** and select the repo you
   just pushed. Railway will create a second service for it.
5. On that new service, go to **Settings**:
   - **Root Directory**: `backend`
   - Railway auto-detects Python via `requirements.txt` and will use the
     `Procfile` (`web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`) to
     start it — no build command needed.
6. Go to **Variables** and add:
   | Variable | Value |
   |---|---|
   | `DB_HOST` | `${{MySQL.MYSQLHOST}}` |
   | `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
   | `DB_USER` | `${{MySQL.MYSQLUSER}}` |
   | `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
   | `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |
   | `CORS_ORIGINS` | *(leave for now — you'll fill this in after step 2)* |
   | `LOG_LEVEL` | `INFO` |

   The `${{MySQL.VARNAME}}` syntax lets Railway automatically pull those values
   from the MySQL service, so you never type the actual credentials in — start
   typing `${{` and Railway will autocomplete the available references.
7. Go to **Settings → Networking → Generate Domain** to get a public URL for
   the backend, e.g. `https://granitos-backend-production.up.railway.app`.
   Railway redeploys automatically on every push to `main`.
8. Visit `<that-url>/docs` — you should see the FastAPI interactive docs. If it
   doesn't load, check the service's **Deploy Logs** for the error (most often
   a missing/misnamed DB variable).

---

## 2. Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (GitHub login).
2. **Add New → Project**, import the same GitHub repo.
3. On the configuration screen:
   - **Root Directory**: `frontend`
   - Framework Preset: Vercel should auto-detect **Vite**
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
4. Add an environment variable:
   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | your Railway backend URL from step 1.7, e.g. `https://granitos-backend-production.up.railway.app` |
5. Click **Deploy**. Vercel gives you a URL like
   `https://granitos.vercel.app` and redeploys automatically on every push to
   `main`.

---

## 3. Connect the two

Go back to Railway → backend service → **Variables**, and set:

```
CORS_ORIGINS=https://granitos.vercel.app
```

Redeploy the backend (Railway does this automatically when you save a
variable). Open your Vercel frontend URL — it should now load real data from
the backend.

---

## 4. Custom domain (optional, do anytime later)

- **Frontend**: Vercel project → **Settings → Domains** → add your domain,
  then create the CNAME/A record it shows you at your domain registrar.
- **Backend**: Railway service → **Settings → Networking → Custom Domain** —
  useful if you want something like `api.yourdomain.com` instead of the
  `*.up.railway.app` URL. If you add this, update `VITE_API_BASE_URL` on
  Vercel and `CORS_ORIGINS` on Railway to match, then redeploy both.

---

## Day-to-day workflow

Once set up, deploying updates is just:

```bash
git add .
git commit -m "describe the change"
git push
```

Railway and Vercel both watch `main` and redeploy automatically — nothing
else to do. Check each platform's **Deploy Logs** if something doesn't come
up after a push.

---

## Alternative: self-hosted VPS

If you'd rather run this on your own Linux server (DigitalOcean, AWS EC2,
etc.) instead of Railway/Vercel, `README.md`'s **Deployment Notes** section
already covers that path: install MySQL, run `database/schema.sql`, run the
backend under a process manager (e.g. systemd) with
`uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`, build the
frontend with `npm run build` and serve the static `frontend/dist/` folder,
and put Nginx or Caddy in front of both for TLS. That path gives you more
control but means you're responsible for server updates, backups, and uptime
yourself — the Railway + Vercel path above is the faster way to get this live.
