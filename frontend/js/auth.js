/* ==========================================================================
   auth.js  -  Sign in and register pages (owner: Moaaz)
   POST /api/auth/login     { email, password }                      -> 200 { token, user }
   POST /api/auth/register  { name, email, password, turnstileToken } -> 201 { token, user }
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function goHome(user) { window.location.href = ui.homeUrl(user.role); }

  /* ---------------- Sign in ---------------- */
  var loginForm = ui.$('login-form');
  if (loginForm) {
    var email = ui.$('login-email');
    var password = ui.$('login-password');
    var formError = ui.$('login-form-error');

    if (window.APP_CONFIG.USE_MOCK) {
      var note = ui.$('demo-note');
      note.hidden = false;
      note.textContent = 'Sample mode: sign in as amira@garden.test (resident) or admin@garden.test (admin) with any password of 8+ characters.';
    }

    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      formError.textContent = '';
      var ok = true;

      ui.fieldError(email, EMAIL_RE.test(email.value.trim()) ? '' : 'Enter a valid email address.');
      ui.fieldError(password, password.value ? '' : 'Enter your password.');
      if (!EMAIL_RE.test(email.value.trim()) || !password.value) ok = false;
      if (!ok) return;

      var button = loginForm.querySelector('button[type="submit"]');
      ui.busy(button, true);
      window.api.post('/auth/login', { email: email.value.trim(), password: password.value })
        .then(function (result) {
          ui.setSession(result.token, result.user);
          goHome(result.user);
        })
        .catch(function (err) {
          // Same message for wrong email and wrong password, so attackers can't find valid accounts
          formError.textContent = err.message;
          password.value = '';
          password.focus();
        })
        .finally(function () { ui.busy(button, false); });
    });
  }

  /* ---------------- Register ---------------- */
  var registerForm = ui.$('register-form');
  if (registerForm) {
    var name = ui.$('register-name');
    var regEmail = ui.$('register-email');
    var regPassword = ui.$('register-password');
    var regError = ui.$('register-form-error');
    var bot = window.turnstileBox.mount('register-turnstile');

    registerForm.addEventListener('submit', function (event) {
      event.preventDefault();
      regError.textContent = '';

      var nameMsg = name.value.trim() ? '' : 'Enter your name.';
      var emailMsg = EMAIL_RE.test(regEmail.value.trim()) ? '' : 'Enter a valid email address.';
      var passMsg = regPassword.value.length >= 8 ? '' : 'Use at least 8 characters.';
      ui.fieldError(name, nameMsg);
      ui.fieldError(regEmail, emailMsg);
      ui.fieldError(regPassword, passMsg);
      if (nameMsg || emailMsg || passMsg) return;

      var token = bot.getToken();
      if (!token) { regError.textContent = 'Please complete the bot check.'; return; }

      var button = registerForm.querySelector('button[type="submit"]');
      ui.busy(button, true);
      window.api.post('/auth/register', {
        name: name.value.trim(),
        email: regEmail.value.trim(),
        password: regPassword.value,
        turnstileToken: token
      })
        .then(function (result) {
          ui.setSession(result.token, result.user);
          goHome(result.user);
        })
        .catch(function (err) {
          regError.textContent = err.message;
          bot.reset();
        })
        .finally(function () { ui.busy(button, false); });
    });
  }
})();
