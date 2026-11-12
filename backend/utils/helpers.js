// Small helpers used by every controller (same as Lab 4)

// Every error has the same shape: { error: { code, message } }
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

// Check a text field. Returns an error message, or null when it is fine.
function checkText(value, label, min, max) {
  if (typeof value !== 'string') {
    return `${label} is required.`;
  }
  const length = value.trim().length;
  if (length < min || length > max) {
    return `${label} must contain between ${min} and ${max} characters.`;
  }
  return null;
}

// Ids in the URL are text ("12"). Returns the number, or null if it is not a valid id.
function toId(value) {
  const id = Number(value);
  if (Number.isInteger(id) && id > 0) {
    return id;
  }
  return null;
}

module.exports = { sendError, checkText, toId };
