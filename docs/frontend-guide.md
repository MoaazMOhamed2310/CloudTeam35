# Frontend Guide

Plain HTML, CSS and JavaScript, written like Lab 2 and Lab 5 (`createElement`, `textContent`, `fetch`).

## Run it

1. Start the backend first (`cd backend`, `npm run dev`). See `backend-guide.md`.
2. Open `frontend/index.html` with **Live Server** (or `npx http-server . -p 8080` from `frontend/`).
3. Sign in with an account you registered, or the admin you created with `npm run create-admin`.

`js/config.js` picks the API address by itself: `http://localhost:3000/api` on your laptop, the Vercel API on the deployed site.

## Files and owners

| Files | Owner |
|---|---|
| `index.html`, `login.html`, `register.html`, `css/auth.css`, `js/auth.js` | Moaaz |
| `resident/plots.html`, `resident/applications.html`, `admin/plots.html`, `admin/applications.html`, `css/plots.css`, `js/*/plots.js`, `js/*/applications.js` | Moaaz |
| `resident/dashboard.html`, `admin/dashboard.html`, `css/dashboard.css`, `js/*/dashboard.js` | Moaaz (integration) |
| `resident/tools.html`, `resident/loans.html`, `admin/tools.html`, `css/tools.css`, `js/resident/tools.js`, `js/resident/loans.js`, `js/admin/tools.js` | Mayan |
| `resident/duties.html`, `admin/duties.html`, `admin/audit-logs.html`, `css/duties.css`, `js/duties-shared.js`, `js/*/duties.js`, `js/admin/audit-logs.js` | Mahmoud |
| **Shared:** `css/tokens.css`, `css/base.css`, `css/components.css`, `js/config.js`, `js/api.js`, `js/common.js`, `_headers` | agree first |

## What each shared JS file does

| File | Job |
|---|---|
| `config.js` | API address and Turnstile site key (Lab 5) |
| `api.js` | `apiRequest()` like Lab 5, adds the login token, sends you to the login page on 401 |
| `common.js` | runs on every inside page: checks you are signed in with the right role, top bar, `showMessage()`, `makeBadge()`, dates |
| `duties-shared.js` | the duties list and the 7-day forecast, used on three pages |

Every inside page loads: `config.js → api.js → common.js → (duties-shared.js) → page.js`

## Rules

- Never put user text in the page with `innerHTML`. Use `textContent` (Lab 2).
- No inline `<script>` or `style="..."` (keeps the CSP in `_headers` strict).
- Colours and sizes only from `tokens.css` (`var(--...)`).
- Hiding admin pages is **not** access control. The backend checks the role on every request (401/403).
