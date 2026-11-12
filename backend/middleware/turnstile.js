// Check the Cloudflare Turnstile token (Lab 5 Part O1, owner: Moaaz)
// The browser sends the token in the X-Turnstile-Token header.
// Only the server knows the secret key, so only the server can ask Cloudflare if the token is real.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function sendBotError(res, message) {
  return res.status(403).json({ error: { code: 'BOT_CHECK_FAILED', message } });
}

async function verifyTurnstile(req, res, next) {
  try {
    const token = req.get('X-Turnstile-Token');
    if (!token) {
      return sendBotError(res, 'Bot check token is missing.');
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      // Fail closed: a missing secret is a server problem (answered as 500)
      throw new Error('TURNSTILE_SECRET_KEY is not set');
    }

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(5000)
    });
    const result = await response.json();

    if (!result.success) {
      console.warn('Turnstile rejected a token:', result['error-codes']);
      return sendBotError(res, 'Bot check failed. Please try again.');
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = verifyTurnstile;
