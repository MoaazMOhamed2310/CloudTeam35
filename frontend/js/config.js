// The address of the REST API. This is the only file that changes between laptop and cloud (Lab 5).
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const API_BASE_URL = isLocal
  ? 'http://localhost:3000/api'
  : 'https://YOUR-API-PROJECT.vercel.app/api';

// Turnstile site key (public). Locally we use Cloudflare's test key.
const TURNSTILE_SITE_KEY = isLocal
  ? '1x00000000000000000000AA'
  : 'YOUR-TURNSTILE-SITE-KEY';
