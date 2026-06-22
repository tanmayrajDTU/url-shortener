# ✂️ Snip — Distributed URL Shortener

A production-ready URL shortener built to demonstrate distributed systems concepts: Redis caching, sliding-window rate limiting, owner-scoped access, async click recording, and cloud-native deployment.

**Stack:** ASP.NET Core 8 · Redis · PostgreSQL · EF Core · React + Vite  
**Hosting:** Railway (API + Redis) · Supabase (PostgreSQL) · Vercel (Frontend)

---

## Architecture

```
Browser (React + Vite)
        │
        │  X-Owner-Token header on every request
        ▼
ASP.NET Core 8 API
        │
        ├─► RateLimiterMiddleware  (Redis sliding window, Lua atomic)
        │
        ├─► UrlsController         POST/GET/DELETE /api/urls
        │         │
        │         ├── Redis (IDistributedCache)   ← L1: sub-ms URL lookup
        │         └── PostgreSQL (EF Core)        ← source of truth
        │
        └─► RedirectController     GET /:code  (public, no auth)
                  │
                  └── fire-and-forget ClickEvent recording
```

### Key design decisions

| Decision | Why |
|---|---|
| Redis sorted-set rate limiter | Atomic Lua script works across horizontally scaled instances; fixed-window counters can be gamed at boundaries |
| Fail-open on Redis error | If Redis goes down, API stays up — URLs still redirect, rate limiting is just suspended |
| `X-Owner-Token` instead of JWT auth | Stateless, no login friction, zero session overhead; token scoped in DB with an index |
| Fire-and-forget click recording | `_ = RecordClickAsync(...)` — redirect latency is not blocked by the analytics write |
| Auto-migrations on startup | `db.Database.MigrateAsync()` in Program.cs means zero-downtime Railway deploys with no manual steps |

---

## Rate Limiting

| Endpoint | Window | Limit | Key |
|---|---|---|---|
| `POST /api/urls` + management | 60s | 10 req | IP + owner token |
| `GET /:code` (redirect) | 60s | 60 req | IP + owner token |
| `GET /api/urls/:code/analytics` | 60s | 30 req | IP + owner token |

All responses include headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 0        # seconds until window resets (0 = not limited)
Retry-After: 43              # only present on 429 responses
```

429 response body:
```json
{ "error": "Too many requests. Retry after 43s.", "retryAfterSeconds": 43 }
```

---

## Local Development

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/)

### Step 1 — Start infrastructure

```bash
# PostgreSQL
docker run -d --name snip-postgres \
  -e POSTGRES_PASSWORD=localpass \
  -e POSTGRES_DB=urlshortener \
  -p 5432:5432 postgres:16

# Redis
docker run -d --name snip-redis \
  -p 6379:6379 redis:7
```

### Step 2 — Configure backend

Edit `backend/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=urlshortener;Username=postgres;Password=localpass",
    "Redis": "localhost:6379"
  },
  "AllowedOrigins": ["http://localhost:5173"]
}
```

### Step 3 — Run migrations + start API

```bash
cd backend

# Install EF Core CLI (once)
dotnet tool install --global dotnet-ef

# Create migration (first time only)
dotnet ef migrations add InitialCreate

# Apply migrations
dotnet ef database update

# Start API  →  http://localhost:5000
# Swagger UI →  http://localhost:5000/swagger
dotnet run
```

> **No Redis?** The app falls back to in-memory cache automatically. Rate limiting will log a warning and fail open (all requests allowed).

### Step 4 — Start frontend

```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

Open http://localhost:5173 — the Vite proxy forwards `/api/*` to `localhost:5000`.

---

## Production Deployment

### 1. Database → Supabase (free PostgreSQL)

1. Create account at [supabase.com](https://supabase.com) → New project
2. Go to **Settings → Database → Connection String → URI**
3. Copy the connection string — you'll need it in the next step

### 2. Backend → Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo, set **Root Directory** to `backend/`
4. Railway auto-detects the `Dockerfile`

**Add Redis plugin:**
- In your Railway project → **+ New** → **Redis**
- Railway auto-injects `REDIS_URL` — but we use `ConnectionStrings__Redis`, so:

**Set environment variables in Railway:**

```
ConnectionStrings__DefaultConnection=<your Supabase URI>
ConnectionStrings__Redis=<Railway Redis internal URL>
AllowedOrigins__0=https://your-frontend.vercel.app
ASPNETCORE_ENVIRONMENT=Production
```

> Migrations run automatically on startup via `Program.cs` — no manual step needed.

**Verify:** Visit `https://your-api.up.railway.app/swagger`

### 3. Frontend → Vercel

```bash
cd frontend
npm run build   # outputs to dist/
```

**Option A — Vercel CLI:**
```bash
npm i -g vercel
vercel --prod
```

**Option B — Vercel Dashboard:**
- New Project → Import GitHub repo → set **Root Directory** to `frontend/`
- Framework preset: **Vite**

**Set environment variable in Vercel:**
```
VITE_API_URL=https://your-api.up.railway.app/api
```

> The `VITE_` prefix is required — Vite only exposes variables with this prefix to the browser bundle.

---

## API Reference

All management endpoints require the `X-Owner-Token` header.  
The redirect endpoint (`GET /:code`) is intentionally public.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/urls` | ✅ token | Create a short URL |
| `GET` | `/api/urls` | ✅ token | List your URLs |
| `GET` | `/api/urls/:code` | ✅ token | Get URL details |
| `GET` | `/api/urls/:code/analytics` | ✅ token | Click analytics |
| `DELETE` | `/api/urls/:code` | ✅ token | Delete a URL |
| `GET` | `/:code` | ❌ public | Redirect to original URL |

### POST /api/urls

```json
{
  "originalUrl": "https://example.com/very/long/path",
  "customAlias": "my-link",
  "expiresAt":   "2025-06-01T00:00:00Z"
}
```

---

## Testing Rate Limits Locally

```bash
# Hit the create endpoint 11 times — the 11th should return 429
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:5000/api/urls \
    -H "Content-Type: application/json" \
    -H "X-Owner-Token: test-token-abc" \
    -d '{"originalUrl":"https://example.com"}'
done
# Expected: 200 200 200 200 200 200 200 200 200 200 429

# Check rate limit headers
curl -I -X POST http://localhost:5000/api/urls \
  -H "Content-Type: application/json" \
  -H "X-Owner-Token: test-token-abc" \
  -d '{"originalUrl":"https://example.com"}'
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 8
# X-RateLimit-Reset: 0
```

---

## Resume Talking Points

- **Redis sliding window rate limiter** — Lua script executes atomically on Redis, preventing race conditions across horizontally scaled instances. Composite key (IP + owner token) prevents NAT/VPN users from sharing rate limit buckets. Fails open if Redis is unavailable so the API never goes down due to the limiter.

- **Two-tier Redis usage** — Redis serves dual purpose: `IDistributedCache` for URL resolution (sub-millisecond redirects, 24h sliding TTL) and `IConnectionMultiplexer` for raw sorted-set operations in the rate limiter.

- **Owner-scoped access without auth** — `X-Owner-Token` generated via `crypto.randomUUID()` on the client, stored in `localStorage`, indexed in PostgreSQL. Stateless, zero session overhead, scales horizontally without sticky sessions.

- **Async analytics** — click recording is fire-and-forget (`_ = RecordClickAsync(...)`) so redirect latency is never blocked by a DB write. The trade-off is at-most-once recording (acceptable for analytics).

- **DB index strategy** — indexes on `short_code` (unique), `owner_token`, and `clicked_at` keep the three hot queries (resolve, dashboard list, analytics time-series) at O(log n).
