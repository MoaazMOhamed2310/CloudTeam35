# Frontend Guide

## Run it

Open the `frontend` folder with **Live Server**, or from `frontend/` run `npx http-server . -p 8080`.
Start at `index.html`. Must be served over http (not double-clicked), because pages load scripts from other folders.

Sample mode (`USE_MOCK: true` in `js/config.js`) needs no backend:

| Account | Email | Password |
|---|---|---|
| Resident | `amira@garden.test` | any 8+ characters |
| Admin | `admin@garden.test` | any 8+ characters |

Sample data lives in the browser tab (sessionStorage). Close the tab to reset it.

## Switch to the real API

In `js/config.js`: set `USE_MOCK: false` and `API_BASE_URL` to the backend. **No page code changes**:
every page calls `api.get/post/patch(...)`, and `mock.js` answers the same endpoints with the same
status codes and error format `{ "error": { "message": "..." } }`.

## Structure and owners

| Files | Owner |
|---|---|
| `index.html`, `login.html`, `register.html`, `css/auth.css`, `js/auth.js`, `js/turnstile.js` | Moaaz |
| `resident/plots.html`, `resident/applications.html`, `admin/plots.html`, `admin/applications.html`, `css/plots.css`, `js/*/plots.js`, `js/*/applications.js` | Moaaz |
| `resident/dashboard.html`, `admin/dashboard.html`, `css/dashboard.css`, `js/*/dashboard.js` | Moaaz (integration) |
| `resident/tools.html`, `resident/loans.html`, `admin/tools.html`, `css/tools.css`, `js/resident/tools.js`, `js/resident/loans.js`, `js/admin/tools.js` | Mayan |
| `resident/duties.html`, `admin/duties.html`, `admin/audit-logs.html`, `css/duties.css`, `js/duties-list.js`, `js/*/duties.js`, `js/admin/audit-logs.js` | Mahmoud |
| **Shared:** `css/tokens.css`, `css/base.css`, `css/components.css`, `js/config.js`, `js/api.js`, `js/layout.js`, `js/mock.js` | Agree first, change on `feature/shared` |

Every page loads: `tokens → base → components → page css`, then `config → api → mock → layout → page js`.

## Rules

- Never put user text in the page with `innerHTML`. Use `ui.el(...)` or `textContent`.
- No inline `<script>` or `style="..."` (keeps the CSP strict).
- Colours and sizes only from `tokens.css` (`var(--...)`).
- Hiding admin pages is **not** access control. The backend must return 401/403 for every protected endpoint.

## Endpoints the pages call

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | `{ name, email, password, turnstileToken }` → 201 `{ token, user }`, 409 email taken |
| POST | `/api/auth/login` | public | `{ email, password }` → `{ token, user }`, 401 same message for wrong email or password |
| GET | `/api/users?role=resident` | admin | assignee list for duties |
| GET | `/api/plots?status=` | logged in | |
| PATCH | `/api/plots/:id/status` | admin | `{ status }` |
| GET | `/api/applications` | logged in | own for resident, all for admin (with `userName`, `plotLabel`) |
| POST | `/api/applications` | resident | `{ season, note, turnstileToken }`, 409 if already active for that season |
| PATCH | `/api/applications/:id/assign` | admin | `{ plotId }`, 409 if plot not available |
| PATCH | `/api/applications/:id/reject` | admin | **new, add to contract** |
| PATCH | `/api/applications/:id/withdraw` | owner | **new, add to contract**; 404 for other residents' records |
| GET | `/api/tools?search=&category=` | logged in | includes `status`: available / on_loan / damaged |
| POST | `/api/tools` | admin | `{ name, category, condition }` |
| PATCH | `/api/tools/:id` | admin | edit, **new** |
| POST | `/api/tools/:id/checkout` | resident | 409 if not available |
| POST | `/api/tools/:id/report` | logged in | report damage, **new** |
| GET | `/api/loans` | logged in | own for resident, all for admin, **new** |
| PATCH | `/api/loans/:id/return` | owner or admin | `{ condition }` |
| GET | `/api/duties` | logged in | own for resident, all for admin (with `plotLabel`, `assigneeName`, `rainExpected`) |
| POST | `/api/duties` | admin | `{ plotId, assignedUserId, dutyDate }` |
| PATCH | `/api/duties/:id` | admin | `{ assignedUserId }` or `{ status: "cancelled" }`, **new** |
| PATCH | `/api/duties/:id/complete` | assignee or admin | |
| GET | `/api/duties/forecast[?date=]` | logged in | one day, or next 7 days without `date`; 502 if Open-Meteo fails |
| GET | `/api/audit-logs` | admin | **new** |
