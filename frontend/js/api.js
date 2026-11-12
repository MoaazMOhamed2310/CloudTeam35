/* ==========================================================================
   api.js  -  One place for every call to the REST API (SHARED, owner: Moaaz)
   - adds the JWT from localStorage as "Authorization: Bearer <token>"
   - sends and receives JSON
   - turns the API error format { error: { message } } into a thrown Error
   - on 401 (missing/expired token) clears the session and goes to login
   ========================================================================== */
(function () {
  'use strict';

  var TOKEN_KEY = 'cgp_token';

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (err) { return null; }
  }

  async function request(path, options) {
    var opts = options || {};

    // Sample mode: answer from mock.js instead of the network (same data shapes and errors)
    if (window.APP_CONFIG.USE_MOCK) {
      try {
        return await window.mock.request(opts.method || 'GET', path, opts.body);
      } catch (err) {
        if (err.status === 401 && path.indexOf('/auth/') !== 0) {
          window.ui && window.ui.clearSession();
          window.location.href = window.ui ? window.ui.loginUrl() : 'login.html';
        }
        throw err;
      }
    }

    var headers = { 'Accept': 'application/json' };
    var token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

    var response = await fetch(window.APP_CONFIG.API_BASE_URL + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });

    var body = null;
    var contentType = response.headers.get('content-type') || '';
    if (contentType.indexOf('application/json') !== -1) body = await response.json();

    if (response.status === 401 && path.indexOf('/auth/') !== 0) {
      window.ui && window.ui.clearSession();
      window.location.href = window.ui ? window.ui.loginUrl() : '/login.html';
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (!response.ok) {
      var message = (body && body.error && body.error.message) || ('Request failed (' + response.status + ')');
      var error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return body;
  }

  window.api = {
    get:   function (path)       { return request(path); },
    post:  function (path, body) { return request(path, { method: 'POST', body: body || {} }); },
    patch: function (path, body) { return request(path, { method: 'PATCH', body: body || {} }); },
    del:   function (path)       { return request(path, { method: 'DELETE' }); },
    TOKEN_KEY: TOKEN_KEY
  };
})();
