# Deploying GRANITOS

This guide uses three platforms that are genuinely free indefinitely, not just
for a trial period — no server administration required, and no monthly bill
kicks in later the way Railway's does:

- **Neon** — hosts the PostgreSQL database (permanent free tier)
- **Render** — hosts the FastAPI backend as a free web service
- **Vercel** — hosts the built React frontend as a static site

Total cost: **$0**, indefinitely, as long as you stay within each platform's
free-tier limits (comfortably true at this app's traffic and data volume).

**The tradeoff to know going in:** Render's free web services spin down after
15 minutes with no traffic and take 30-60 seconds to wake back up on the next
request. For a shop-floor tool used during business hours, that means the
first page load after a quiet stretch will feel slow once, then be normal
again. If that's ever a dealbreaker, upgrading just the Render service to a
paid tier (~$7/month) removes it — everything else stays free either way.

If you'd rather run everything yourself on a free VM instead of these three
managed platforms, skip to
[Alternative: self-hosted VPS](#alternative-self-hosted-vps).

---

## 0. Push the code to GitHub

Render and Vercel both deploy by connecting to a GitHub repo.

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

## 1. Database on Neon

1. Go to [neon.tech](https://neon.tech) and sign up (GitHub login is easiest).
2. **Create a project.** Neon gives you a database (default name `neondb`)
   immediately — no extra setup.
3. On the project dashboard, click **Connect** and copy the connection
   string. It looks like:
   ```
   postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   ```
   Save this — it's your `DATABASE_URL` for step 2.
4. **Initialize the schema.** Open the **SQL Editor** in the Neon dashboard,
   paste in the full contents of `database/schema.sql` from this repo, and
   run it. (Alternatively, from your machine:
   `psql "<your-connection-string>" -f database/schema.sql`.)
5. That's it — Neon's free tier has no expiry date and autoscales to zero
   when idle, waking up automatically on the next connection (unlike Render's
   free web service, this doesn't need a manual restart).

---

## 2. Backend on Render

1. Go to [render.com](https://render.com) and sign up (GitHub login is
   easiest). No credit card required for the free tier.
2. **New → Web Service**, connect the GitHub repo you just pushed.
3. Configure it:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3 (auto-detected)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     (this matches `backend/Procfile`, but Render needs it typed into this
     field directly rather than reading the Procfile)
   - **Instance Type**: **Free**
4. Add environment variables (**Environment** tab):
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step 1.3 |
   | `CORS_ORIGINS` | *(leave for now — you'll fill this in after step 3)* |
   | `LOG_LEVEL` | `INFO` |
5. Click **Create Web Service**. Render builds and deploys, then gives you a
   public URL like `https://granitos-backend.onrender.com`. It redeploys
   automatically on every push to `main`.
6. Visit `<that-url>/docs` — you should see the FastAPI interactive docs
   (allow up to a minute on the very first load if the service was asleep).
   If it doesn't load, check the service's **Logs** tab for the error (most
   often a malformed `DATABASE_URL`).

---

## 3. Frontend on Vercel

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
   | `VITE_API_BASE_URL` | your Render backend URL from step 2.5, e.g. `https://granitos-backend.onrender.com` |
5. Click **Deploy**. Vercel gives you a URL like
   `https://granitos.vercel.app` and redeploys automatically on every push to
   `main`.

---

## 4. Connect the two

Go back to Render → your backend service → **Environment**, and set:

```
CORS_ORIGINS=https://granitos.vercel.app
```

Save — Render redeploys automatically. Open your Vercel frontend URL — it
should now load real data from the backend (give it a moment on the first
request if the backend had gone to sleep).

---

## 5. Custom domain (optional, do anytime later)

- **Frontend**: Vercel project → **Settings → Domains** → add your domain,
  then create the CNAME/A record it shows you at your domain registrar.
- **Backend**: Render service → **Settings → Custom Domains** — useful if you
  want something like `api.yourdomain.com` instead of the `*.onrender.com`
  URL. If you add this, update `VITE_API_BASE_URL` on Vercel and
  `CORS_ORIGINS` on Render to match, then redeploy both.

---

## Day-to-day workflow

Once set up, deploying updates is just:

```bash
git add .
git commit -m "describe the change"
git push
```

Render and Vercel both watch `main` and redeploy automatically. Neon needs no
redeploy step at all — schema changes are applied by re-running SQL against
it directly. Check each platform's logs if something doesn't come up after a
push.

---

## Alternative: self-hosted VPS

If cold starts are a dealbreaker and you'd rather run this on a server you
manage yourself, Oracle Cloud's "Always Free" tier gives you a real Linux VM
with no time limit (unlike AWS/GCP's 12-month free trials) — see
[oracle.com/cloud/free](https://www.oracle.com/cloud/free/). On it, install
PostgreSQL, run `database/schema.sql`, run the backend under a process
manager (e.g. systemd) with
`uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`, build the
frontend with `npm run build` and serve the static `frontend/dist/` folder,
and put Nginx or Caddy in front of both for TLS. This path is also free
indefinitely, with no spin-down/cold-start behavior — the tradeoff is that
you're personally responsible for OS security patches, database backups, and
uptime, rather than a managed platform handling it.
