// Sign in and register pages (owner: Moaaz)
// POST /api/auth/login     { email, password }        -> { token, user }
// POST /api/auth/register  { name, email, password }  -> { token, user }   (+ Turnstile token)

function goToDashboard(user) {
  window.location.href = `${user.role}/dashboard.html`;
}

// ---------------- Sign in ----------------
const loginForm = document.querySelector('#login-form');

if (loginForm) {
  const loginMessage = document.querySelector('#login-form-error');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#login-email').value.trim();
    const password = document.querySelector('#login-password').value;

    if (!email || !password) {
      loginMessage.textContent = 'Please enter your email and password.';
      return;
    }

    try {
      loginMessage.textContent = '';
      const result = await sendJson('/auth/login', 'POST', { email, password });
      saveLogin(result.token, result.user);
      goToDashboard(result.user);
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });
}

// ---------------- Register ----------------
const registerForm = document.querySelector('#register-form');

if (registerForm) {
  const registerMessage = document.querySelector('#register-form-error');

  // Draw the Turnstile widget (Lab 5 Part O1)
  let turnstileWidgetId = null;
  if (window.turnstile) {
    turnstileWidgetId = turnstile.render('#turnstile-widget', { sitekey: TURNSTILE_SITE_KEY });
  }

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.querySelector('#register-name').value.trim();
    const email = document.querySelector('#register-email').value.trim();
    const password = document.querySelector('#register-password').value;

    if (!name || !email) {
      registerMessage.textContent = 'Please enter your name and email.';
      return;
    }
    if (password.length < 8) {
      registerMessage.textContent = 'The password must be at least 8 characters.';
      return;
    }

    const turnstileToken = window.turnstile ? turnstile.getResponse(turnstileWidgetId) : '';
    if (!turnstileToken) {
      registerMessage.textContent = 'Please complete the bot check first.';
      return;
    }

    try {
      registerMessage.textContent = '';
      const result = await sendJson('/auth/register', 'POST', { name, email, password }, { 'X-Turnstile-Token': turnstileToken });
      saveLogin(result.token, result.user);
      goToDashboard(result.user);
    } catch (error) {
      registerMessage.textContent = error.message;
    } finally {
      // A token works only once, so ask the widget for a fresh one
      if (window.turnstile) {
        turnstile.reset(turnstileWidgetId);
      }
    }
  });
}
