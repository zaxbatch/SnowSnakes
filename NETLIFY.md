# SnowSnakes on Netlify

The site is live at **https://snowsnakes.zerric.xyz**.

- Netlify project: `snowsnakes-zerric`
- Site ID: `fa925d98-3075-4b1c-959d-4e9845437867`
- Netlify URL: https://snowsnakes-zerric.netlify.app
- The accidental site in the other account was deleted.

- React is built to `frontend/build` and served by Netlify's CDN.
- The Express API runs as a **Netlify Function** (`netlify/functions/api.js`)
  wrapped with `serverless-http`.
- Data stays in **Aiven Postgres**.
- Game files are stored in **Cloudinary**, not on the web server's disk.
- Schema migrations run during the Netlify **build**.

```
Browser
  ├── /, /jokes, /games, ...  →  Netlify CDN (frontend/build)
  └── /api/*                  →  Netlify Function (Express + serverless-http)
                                   ├── Aiven Postgres
                                   └── Cloudinary (game files, doodles, songs)
```

> A long-lived **Netlify Server** would fit this Express app better, but this
> account is on a plan where Server is unavailable (“Netlify Server is only
> available on credit-based plans”). The Function adapter is the free-plan
> path. It buffers the whole request, so game uploads are capped at 4 MB.

---

## 1. Current deployment facts

| Item | Value |
| --- | --- |
| Netlify project | `snowsnakes-zerric` (`fa925d98-3075-4b1c-959d-4e9845437867`) |
| Custom domain | `snowsnakes.zerric.xyz` (NETLIFY DNS record created automatically) |
| Netlify URL | https://snowsnakes-zerric.netlify.app |
| API function | `/.netlify/functions/api` |
| Database | Aiven `snow-snakes-...aivencloud.com:26989/defaultdb` |
| Migrations | 001, 002 and 003 applied |
| Production data | 49 users, 722 jokes, 24 games, 17 songs, 20 doodles, 3 episodes |
| Game 23 | Imported from the Hostinger disk into Cloudinary |
| Game 120 | `file_count = 1` but its file is not in `backend/uploads/games`; re-upload it or copy it from Hostinger |

Temporary upload tests were created and deleted, including their Cloudinary
assets. TLS for `snowsnakes.zerric.xyz` was issued by Let's Encrypt and HTTP
redirects to HTTPS.

---

## 2. Environment variables

These are set on the Netlify site:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Aiven Service URI, including `?sslmode=require`. |
| `JWT_SECRET` | Same value the old host used. |
| `CLOUDINARY_CLOUD_NAME` | `r6natkse` |
| `CLOUDINARY_API_KEY` | Cloudinary console. |
| `CLOUDINARY_API_SECRET` | Server-only. |
| `HUBSPOT_ACCESS_TOKEN` | Optional; lead creation is skipped when empty. |
| `FRONTEND_URL` | `https://snowsnakes.zerric.xyz,https://snowsnakes-zerric.netlify.app` |
| `DB_POOL_MAX` | `5` |
| `GAME_MAX_FILE_BYTES` | `4000000` (4 MB; see the Function limit below) |
| `GAME_MAX_TOTAL_BYTES` | `4000000` |
| `REACT_APP_CLOUDINARY_CLOUD_NAME` | Build-time. |
| `REACT_APP_CLOUDINARY_IMAGE_PRESET` | Build-time. |
| `REACT_APP_CLOUDINARY_AUDIO_PRESET` | Build-time. |

`NODE_VERSION=24` and `CI=false` are set in `netlify.toml`.

**Free-plan limitation:** Netlify only allows scopes (and therefore secret
marking) on paid plans. The variables above are currently stored as regular
environment variables. They are still only readable by account members/builds,
never shipped to the browser unless prefixed with `REACT_APP_`. If you upgrade
the plan, mark `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_API_SECRET`, and
`HUBSPOT_ACCESS_TOKEN` as secrets and exclude the `post-processing` scope.

To change a variable:

```bash
npx netlify-cli env:set KEY value --site fa925d98-3075-4b1c-959d-4e9845437867
npx netlify-cli env:list --site fa925d98-3075-4b1c-959d-4e9845437867
```

Or use **Site configuration → Environment variables** in the Netlify UI.

---

## 3. Deploying

### CLI (what was used for this deploy)

```bash
cd snowSnakes
npx netlify-cli login                  # log in to the account that owns zerric.xyz
npx netlify-cli link --id fa925d98-3075-4b1c-959d-4e9845437867
npx netlify-cli deploy --prod --build
```

`--build` runs `npm run build:netlify` locally:

1. `npm run migrate` — applies `backend/migrations/*.sql` to `DATABASE_URL`.
2. `npm ci --prefix frontend` — installs the React dependencies from the lockfile.
3. `npm run build --prefix frontend` — produces `frontend/build`.

Netlify then bundles `netlify/functions/api.js` with esbuild. No Netlify Server
entry may exist: if `netlify/server/` is added back, the build fails on this plan.

### Git-connected deploys (recommended for ongoing work)

Netlify → **Site configuration → Build & deploy → Link repository** and choose
`zaxbatch/SnowSnakes`, branch `main`. The settings come from `netlify.toml`:

- Build command: `npm run build:netlify`
- Publish directory: `frontend/build`
- Functions directory: `netlify/functions`

Once linked, every push to `main` builds and deploys automatically. Until then,
use the CLI command above after changes.

> **Before linking the repository, commit and push these changes.** GitHub's
> `main` branch still contains the pre-Netlify version of the project. Linking
> it now would build that older code and replace the working CLI deploy.

---

## 4. Verifying a deploy

```bash
curl https://snowsnakes.zerric.xyz/api/health
curl https://snowsnakes.zerric.xyz/api/health/db
curl -o /dev/null -w '%{http_code}\n' https://snowsnakes.zerric.xyz/games
```

Expected:

```json
{"ok":true,"service":"snowsnakes-api","uptime":1.2}
{"ok":true,"database":"reachable","latencyMs":78}
```

Also check:

- Direct visits to `/jokes`, `/doodles`, `/songs`, `/games`, `/spread`,
  `/randomizer`, `/admin` return the SPA shell.
- Login works (`JWT_SECRET` must match the old host).
- A doodle/song upload works (Cloudinary).
- A small game upload and its launch work.

Function logs are in **Netlify → Logs → Functions** (or the CLI output).

---

## 5. Game files and limits

New game uploads go to Cloudinary:

```
snowsnakes/games/<game id>/<original relative path>
```

The entry `index.html` is also stored in `games.entry_html`, because Cloudinary
delivers raw HTML as an attachment. The launch endpoint serves that HTML with a
`<base href>` pointing at the game's Cloudinary folder, so relative `<script src>`,
`<img src>`, CSS `url()`, and `fetch()` calls work.

### The 4 MB cap

A Netlify Function buffers the whole request and the platform limit is 6 MB.
Multipart/base64 adds ~33%, so the safe ceiling is about 4 MB:

| Limit | Value | Where |
| --- | --- | --- |
| Per file | 4 MB | `GAME_MAX_FILE_BYTES` |
| Per game | 4 MB | `GAME_MAX_TOTAL_BYTES` |
| File count | 100 | `backend/routes/games.js` |

This is smaller than the 10 MB Cloudinary raw-file limit. If you need larger
games on the free plan, move the file upload to the browser (direct unsigned or
signed Cloudinary upload) and send only the manifest to the API; the Function
body then stays small. Ask if you want that implemented.

### Legacy Hostinger files

`backend/uploads/games` still contains files from the old host. The importer was
run against Aiven:

```bash
npm run import:game-assets -- --dry-run
npm run import:game-assets
```

It imported game **23** (“T”). Game **120** (“SnowSnake”) has `file_count = 1`
but no matching local folder, so it still points at the old disk. Copy its file
from Hostinger into `backend/uploads/games/120/`, then rerun the importer, or
re-upload the game from the UI.

Games that used root-relative asset paths (`/assets/x.png`) will not resolve
against the Cloudinary `<base>`; use relative paths.

---

## 6. Database

The production database is Aiven. The connection URL includes
`?sslmode=require`. Newer `pg` versions treat `require` as `verify-full`, which
rejects Aiven's self-signed chain; `backend/config/db.js` appends
`uselibpqcompat=true` for `require`/`prefer`/`verify-ca`, restoring libpq's
encrypt-without-verify behavior. Set `DB_CA_CERT` to Aiven's CA bundle if you
want full certificate verification.

Apply migrations manually at any time:

```bash
DATABASE_URL='postgresql://...aivencloud.com...' npm run migrate
```

Migration 003 added `games.files` and `games.entry_html`; 001/002 were already
idempotent no-ops on this database.

If you ever need to copy data from another database:

```bash
pg_dump "$OLD_DATABASE_URL" --no-owner --no-acl -Fc -f snowsnakes.dump
pg_restore --no-owner --no-acl -d "$DATABASE_URL" snowsnakes.dump
npm run migrate
```

---

## 7. Custom domain: snowsnakes.zerric.xyz

`zerric.xyz` is already delegated to Netlify DNS (`dns1.p04.nsone.net` etc.),
so add the subdomain from the Netlify account/team that owns `zerric.xyz`:

1. Open the new site → **Domain management → Add a domain**.
2. Enter `snowsnakes.zerric.xyz`.
3. If Netlify does not create the DNS record automatically, open
   **Domains → zerric.xyz → DNS records**:
   - delete any old `snowsnakes` **A** records (they currently point at
     `98.84.224.111` / `18.208.88.157`, the old host),
   - add a **CNAME** record: name `snowsnakes`, value
     `<site-name>.netlify.app`.
4. Wait for Netlify to verify the domain and issue the TLS certificate.

Netlify created a managed `NETLIFY` record for `snowsnakes.zerric.xyz` pointing
at `snowsnakes-zerric.netlify.app`; the old A records were replaced. TLS is
issued by Let's Encrypt, and HTTP redirects to HTTPS.

Keep the old host available until DNS/TLS and the Netlify site have both been
verified.

---

## 8. Local development

```bash
npm install                 # root dependencies, including serverless-http
npm run install:all         # backend and frontend dependencies
npm run migrate             # apply migrations
npm run dev                 # Express on :5000 + CRA on :3000
```

To exercise the Function adapter locally:

```bash
npx netlify-cli dev
```

`netlify dev` runs the frontend and the `api` function with the same redirects
and environment variables. It does not run the build-time migration step; run
`npm run migrate` yourself.

---

## 9. Function limits and behaviour

- **Request body:** 6 MB buffered, including base64 overhead. This is why game
  uploads are capped at 4 MB.
- **Execution:** 60 seconds synchronous (default; configurable up to the plan’s
  maximum). A 4 MB Cloudinary upload normally finishes well inside that.
- **Concurrency:** one request per function instance; Netlify starts more
  instances as needed. Each instance creates its own small Postgres pool, so
  keep `DB_POOL_MAX` below the Aiven connection limit.
- **Cold starts:** the first request after idle can take a second or two; the
  frontend API timeout is 30 seconds.
- **Disk:** no durable local disk. `/tmp` is writable but ephemeral; game files
  go to Cloudinary.
- **Deploy Previews** share the production database unless you scope a separate
  `DATABASE_URL` to the Deploy Preview context.

---

## 10. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `POST /api/games` returns 413 before Express runs | The multipart body exceeded the Function's 6 MB buffered request limit. Keep the game under 4 MB. |
| `Task timed out after 60.00 seconds` | Cloudinary upload or a slow query exceeded the Function timeout. Check the Function logs; reduce the upload or query. |
| Build fails at `npm run migrate` | The build cannot reach Aiven, the password is not URL-encoded, or the user does not own the tables. Run the same command locally with the same `DATABASE_URL`. |
| `/api/health/db` returns 503 | Runtime `DATABASE_URL` is wrong or Aiven's IP allowlist blocks Netlify. |
| `self-signed certificate in certificate chain` | `sslmode=require` is being treated as verify-full. The app's `uselibpqcompat=true` handling should prevent this; if a custom script opens a raw `pg` pool, add the flag or use the app's pool. |
| Login returns 401 for everyone | `JWT_SECRET` differs from the old host. |
| CORS error in the browser | Add the site origin/custom domain to `FRONTEND_URL` and redeploy. |
| `Netlify Server is only available on credit-based plans` | Remove `netlify/server/` and use the Function adapter in `netlify/functions/api.js`. |
| `/games` works but `/api/games` returns the SPA HTML | The `/api/*` redirect must come before the SPA redirects in `netlify.toml`. |
| `Cannot find module ...` in Function logs | A dependency is missing from the root `package.json`; Netlify installs root dependencies when bundling functions. |

---

## Files that make this work

| File | Purpose |
| --- | --- |
| `netlify.toml` | Build command, publish directory, function directory, `/api/*` rewrite, SPA rewrites, cache headers. |
| `netlify/functions/api.js` | Netlify Function entry; wraps `backend/app.js` with `serverless-http` and normalizes the function path back to `/api/*`. |
| `backend/app.js` | Shared Express app (routes + middleware). |
| `backend/config/db.js` | Postgres pool, Aiven TLS handling, `uselibpqcompat` compatibility. |
| `backend/db/migrate.js` | Idempotent migration runner with an advisory lock. |
| `backend/scripts/migrate.js` | `npm run migrate`; used by the Netlify build. |
| `backend/migrations/003_game_files.sql` | Adds `games.files` and `games.entry_html`. |
| `backend/services/gameAssets.js` | Cloudinary upload/delete + launch HTML `<base>` injection. |
| `backend/scripts/import-game-assets.js` | Imports old Hostinger game folders into Cloudinary. |
| `backend/.env.example` / `frontend/.env.example` | Every variable the build and server read. |
