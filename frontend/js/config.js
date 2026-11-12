/* ==========================================================================
   config.js  -  The only file that changes between laptop and cloud (Lab 5)
   ========================================================================== */
window.APP_CONFIG = {
  // Local backend while developing. After deploying, change to:
  //   'https://YOUR-API-PROJECT.vercel.app/api'
  API_BASE_URL: 'http://localhost:3000/api',

  // true  = pages use the sample data in mock.js (no backend needed)
  // false = pages call the real REST API through api.js
  USE_MOCK: true,

  // Cloudflare Turnstile public site key (safe to commit; the secret stays in backend/.env)
  TURNSTILE_SITE_KEY: 'YOUR-TURNSTILE-SITE-KEY'
};
