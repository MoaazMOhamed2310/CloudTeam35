# Backend Guide

Node.js 20+ · Express 5 · Neon Postgres (`@neondatabase/serverless`) · bcryptjs · JSON Web Tokens · Vercel

Written like Lab 4 and Lab 5: **routes** (method + path) → **controllers** (read request, validate, choose status code, `try/catch` + `next(error)`) → **services** (SQL with the Neon `sql` tagged template, nothing about HTTP).

## 1. Run it on your laptop

```bash
cd backend
npm install
```

1. **Neon:** create a project (Free plan, US East), open **SQL Editor**, paste and run `db/schema.sql`, then `db/seed.sql`.
2. **.env:** copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`: Neon › Connect (pooling on)
   - `JWT_SECRET`: run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste the result
3. **Admin account:** admins cannot sign up on the website:
   ```bash
   npm run create-admin -- admin@garden.test "Garden Admin" "a-long-password"
   ```
4. **Start:** `npm run dev`, then open http://localhost:3000/api/health
5. **Frontend:** open `frontend/index.html` with Live Server (port 5500) or http-server (port 8080) and sign in.

Test each endpoint with `backend/requests.http` (VS Code **REST Client** extension) or Postman.

## 2. Deploy

**API on Vercel** (Lab 5 Part 10): Import the repo › Root Directory `backend` › Framework preset Express. Environment variables:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | a different long random string from your laptop's |
| `CORS_ORIGINS` | `http://localhost:8080,https://<project>.pages.dev` |
| `TURNSTILE_SECRET_KEY` | the real secret from the Cloudflare Turnstile widget |
| `NODE_ENV` | `production` |

**Frontend on Cloudflare Pages** (Lab 5 Part O3): Root directory `frontend`, build command `exit 0`.
Replace `YOUR-API-PROJECT` in `frontend/js/config.js` **and** `frontend/_headers`, put the real site key in `config.js`, and add `<project>.pages.dev` to the Turnstile widget's hostnames.

## 3. Who owns what

| Files | Owner |
|---|---|
| `routes/auth.js`, `controllers/auth.js`, `routes/users.js`, `services/authService.js`, `middleware/auth.js`, `middleware/turnstile.js`, `scripts/createAdmin.js` | Moaaz (auth) |
| `routes/plots.js`, `routes/applications.js`, `controllers/plots.js`, `controllers/applications.js`, `services/plotService.js` | Moaaz |
| `routes/tools.js`, `routes/loans.js`, `controllers/tools.js`, `controllers/loans.js`, `services/toolService.js` | Mayan |
| `routes/duties.js`, `controllers/duties.js`, `services/dutyService.js`, `services/weatherService.js`, `routes/auditLogs.js`, `services/auditService.js` | Mahmoud |
| **Shared:** `server.js`, `db/neon.js`, `db/schema.sql`, `db/seed.sql`, `utils/helpers.js`, `package.json`, `.env.example` | agree first |

## 4. Endpoints

Every error: `{ "error": { "code": "...", "message": "..." } }`. Every endpoint except register, login and health needs `Authorization: Bearer <token>`.

| Method | Path | Who | Success | Errors |
|---|---|---|---|---|
| POST | `/api/auth/register` | public + Turnstile | 201 `{token,user}` | 400, 403, 409 |
| POST | `/api/auth/login` | public | 200 `{token,user}` | 400, 401 |
| GET | `/api/users?role=resident` | admin | 200 | 401, 403 |
| GET | `/api/plots?status=` | signed in | 200 | 400, 401 |
| PATCH | `/api/plots/:id/status` | admin | 200 | 400, 401, 403, 404 |
| GET | `/api/applications` | own / admin all | 200 | 401 |
| POST | `/api/applications` | resident + Turnstile | 201 | 400, 401, 403, 409 |
| PATCH | `/api/applications/:id/assign` | admin | 200 | 400, 401, 403, 404, 409 |
| PATCH | `/api/applications/:id/reject` | admin | 200 | 401, 403, 404, 409 |
| PATCH | `/api/applications/:id/withdraw` | owner | 200 | 401, 403, 404, 409 |
| GET | `/api/tools` | signed in | 200 | 401 |
| POST | `/api/tools` | admin | 201 | 400, 401, 403 |
| PATCH | `/api/tools/:id` | admin | 200 | 400, 401, 403, 404 |
| POST | `/api/tools/:id/checkout` | resident | 201 | 401, 403, 404, 409 |
| POST | `/api/tools/:id/report` | the borrower | 200 | 401, 403, 404 |
| GET | `/api/loans` | own / admin all | 200 | 401 |
| PATCH | `/api/loans/:id/return` | borrower / admin | 200 | 400, 401, 404, 409 |
| GET | `/api/duties` | own / admin all | 200 | 401 |
| GET | `/api/duties/forecast[?date=]` | signed in | 200 | 400, 401, 502 |
| POST | `/api/duties` | admin | 201 | 400, 401, 403 |
| PATCH | `/api/duties/:id` | admin | 200 | 400, 401, 403, 404, 409 |
| PATCH | `/api/duties/:id/complete` | assignee / admin | 200 | 401, 404, 409 |
| GET | `/api/audit-logs` | admin | 200 | 401, 403 |

Someone else's record answers **404, not 403**, so ids cannot be used to discover other residents' data.

## 5. Security controls (use these in the threat model)

| Threat | Control in the code |
|---|---|
| Password theft from the database | passwords stored only as bcrypt hashes (`authService.js`) |
| Account discovery | same 401 message for an unknown email and a wrong password |
| Forged or tampered token | JWT signed with `JWT_SECRET`, `algorithms: ['HS256']`, expires after 2 hours (`middleware/auth.js`) |
| Using admin functions as a resident | `requireAdmin` / `requireResident` on the routes → 403; role is never read from the register body |
| Reading or changing someone else's records | ownership checks in the controllers (`loan.userId !== req.user.id` …) → 404 |
| SQL injection | only the Neon `sql` tagged template (values sent as parameters, Lab 5) |
| Invalid or malicious input | `checkText`, allowed-value Sets and id checks in every controller (Lab 4); `CHECK` rules in the database |
| Bots and spam | Cloudflare Turnstile checked on the server for register and plot application (Lab 5 Part O1) |
| Other websites calling the API | CORS allow-list from `CORS_ORIGINS` (Lab 5) |
| Browser attacks (XSS, clickjacking) | `textContent` everywhere; CSP and security headers in `frontend/_headers` (Lab 5) |
| Secrets in GitHub | secrets only in `.env` (git-ignored) and Vercel; `.env.example` has no real values |
| Weather service down | 5 s timeout; forecast answers 502, duties still load |
| No record of who did what | `audit_logs` table: sign-ins, failed sign-ins and every change, never passwords |

**Not in the code yet:** login rate limiting (Threat 1 in the proposal). It is taught in Lab 6, so either add it then or change Threat 1.

## 6. Changes to add to the proposal / report

- New endpoints: reject, withdraw, `PATCH /tools/:id`, report damage, `GET /loans`, `PATCH /duties/:id`, `GET /users`, `GET /audit-logs`.
- `duties` table now has `completed_at`; `loans` has `return_condition`.
- The audit log records who completed each duty.
