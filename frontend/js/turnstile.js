/* ==========================================================================
   turnstile.js  -  Cloudflare Turnstile bot check (SHARED, owner: Moaaz)
   Used on public write actions: register and plot application.
   The token is sent to the API, which verifies it server-side with
   Cloudflare's siteverify endpoint (the secret key never reaches the browser).
   ========================================================================== */
(function () {
  'use strict';

  var scriptPromise = null;

  function loadScript() {
    if (!scriptPromise) {
      scriptPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = resolve;
        s.onerror = function () { reject(new Error('Could not load the bot check.')); };
        document.head.appendChild(s);
      });
    }
    return scriptPromise;
  }

  /**
   * Put the widget inside the element with this id.
   * Returns { getToken(), reset() }.
   */
  function mount(containerId) {
    var box = document.getElementById(containerId);
    var token = null;
    var widgetId = null;

    if (window.APP_CONFIG.USE_MOCK) {
      box.textContent = 'Bot check (Cloudflare Turnstile) is skipped in sample mode.';
      return { getToken: function () { return 'mock-turnstile-token'; }, reset: function () {} };
    }

    box.textContent = 'Loading bot check…';
    loadScript().then(function () {
      box.textContent = '';
      widgetId = window.turnstile.render(box, {
        sitekey: window.APP_CONFIG.TURNSTILE_SITE_KEY,
        callback: function (t) { token = t; },
        'expired-callback': function () { token = null; },
        'error-callback': function () { token = null; }
      });
    }).catch(function (err) { box.textContent = err.message; });

    return {
      getToken: function () { return token; },
      reset: function () { token = null; if (widgetId !== null) window.turnstile.reset(widgetId); }
    };
  }

  window.turnstileBox = { mount: mount };
})();
