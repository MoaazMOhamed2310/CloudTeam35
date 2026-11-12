// Every call to the API goes through apiRequest (same idea as Lab 5).
// It also adds the login token, so the backend knows who is calling.

// ---------- Login token saved in the browser ----------
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
}

function saveLogin(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Pages inside resident/ and admin/ have data-root="../" on <body>
const ROOT = document.body.dataset.root || '';

// ---------- The request helper ----------
async function apiRequest(path, options = {}) {
  options.headers = options.headers || {};

  const token = getToken();
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE_URL + path, options);

  let body = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  }

  // 401 = not signed in or the token expired: go back to the login page
  if (response.status === 401 && !path.startsWith('/auth/')) {
    logout();
    window.location.href = ROOT + 'login.html';
  }

  if (!response.ok) {
    const message = body?.error?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

// Shortcut for POST and PATCH requests that send JSON
function sendJson(path, method, data = {}, extraHeaders = {}) {
  return apiRequest(path, {
    method: method,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(data)
  });
}
