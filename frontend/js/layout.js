/* ==========================================================================
   layout.js  -  Shared helpers for every page (SHARED, owner: Moaaz)
   Load order on every page:  config.js -> api.js -> mock.js -> layout.js -> page.js
   Everything is exposed on window.ui so page scripts stay short.

   Safety rules (Lab 2 + Lab 3 trust boundary + CSP):
   - user-supplied text is always added with textContent, never innerHTML
   - no inline scripts or inline style attributes
   ========================================================================== */
(function () {
  'use strict';

  // Lets the CSS collapse the mobile menu only when JavaScript is running
  document.documentElement.classList.add('js');

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var USER_KEY = 'cgp_user';

  /* ------------------------------------------------------------------ */
  /* DOM helpers                                                         */
  /* ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }

  /** el('div', {class:'x', text:'hi', onClick: fn, 'aria-label':'..'}, child, child) */
  function el(tag, props) {
    var node = document.createElement(tag);
    var p = props || {};
    Object.keys(p).forEach(function (key) {
      var value = p[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.indexOf('on') === 0) node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? '' : value);
    });
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined || child === false) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  function icon(name) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function toast(message, isError) {
    var region = $('toast-region');
    if (!region) return;
    var item = el('div', { class: 'toast' + (isError ? ' toast--error' : '') }, icon(isError ? 'close' : 'check'), message);
    region.appendChild(item);
    setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 3500);
  }

  /** Empty-state block: ui.empty('No tools found', 'Try another search.') */
  function empty(title, text) {
    return el('div', { class: 'empty' }, el('strong', { text: title }), text || '');
  }

  /** One table row that spans all columns, used for empty / loading states */
  function emptyRow(colspan, title, text) {
    return el('tr', {}, el('td', { colspan: String(colspan) }, empty(title, text)));
  }

  /** Show a field error under an input and mark it invalid for screen readers */
  function fieldError(input, message) {
    var box = $(input.id + '-error');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (box) box.textContent = message || '';
  }

  /** Disable a button and show the spinner while a request runs */
  function busy(button, isBusy) {
    button.disabled = isBusy;
    button.setAttribute('aria-busy', String(isBusy));
  }

  /**
   * Filter chips: one button pressed at a time.
   * ui.chips('status-chips', 'status', function (value) { ... })
   * Returns a function that gives the current value.
   */
  function chips(groupId, attr, onChange) {
    var group = $(groupId);
    var buttons = group.querySelectorAll('.chip');
    var current = '';
    buttons.forEach(function (b) {
      if (b.getAttribute('aria-pressed') === 'true') current = b.getAttribute('data-' + attr);
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        current = b.getAttribute('data-' + attr);
        onChange(current);
      });
    });
    return function () { return current; };
  }

  /** Fill a <select> or <datalist> with options: [{ value, text }] (keepFirst keeps the placeholder option) */
  function fillSelect(select, options, keepFirst) {
    var keep = keepFirst ? 1 : 0;
    while (select.children.length > keep) select.removeChild(select.lastElementChild);
    options.forEach(function (o) { select.appendChild(el('option', { value: String(o.value), text: o.text })); });
  }

  /* ------------------------------------------------------------------ */
  /* Dates                                                               */
  /* ------------------------------------------------------------------ */
  var DAY_MS = 86400000;
  var fmtShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  var fmtLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
  var fmtDateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(n) { var d = startOfDay(new Date()); d.setDate(d.getDate() + n); return d; }
  function diffDays(date) { return Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS); }
  function isoDate(d) {
    var x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }

  /** '2026-11-12' -> local Date at midnight (new Date('2026-11-12') would be UTC and can shift a day) */
  function parseDay(str) { var p = String(str).split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }

  function relativeDay(date) {
    var n = diffDays(date);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n > 1) return 'In ' + n + ' days';
    return Math.abs(n) + ' days ago';
  }

  /* ------------------------------------------------------------------ */
  /* Status labels: ONE mapping used for every badge on the site         */
  /* ------------------------------------------------------------------ */
  var STATUS = {
    pending:     { label: 'Pending',     tone: 'warning' },
    approved:    { label: 'Approved',    tone: 'success' },
    rejected:    { label: 'Rejected',    tone: 'danger' },
    withdrawn:   { label: 'Withdrawn',   tone: 'neutral' },
    on_loan:     { label: 'On loan',     tone: 'info' },
    returned:    { label: 'Returned',    tone: 'neutral' },
    available:   { label: 'Available',   tone: 'success' },
    assigned:    { label: 'Assigned',    tone: 'info' },
    maintenance: { label: 'Maintenance', tone: 'warning' },
    damaged:     { label: 'Damaged',     tone: 'danger' },
    completed:   { label: 'Completed',   tone: 'success' },
    cancelled:   { label: 'Cancelled',   tone: 'neutral' },
    overdue:     { label: 'Overdue',     tone: 'danger' },
    good:        { label: 'Good',        tone: 'success' },
    fair:        { label: 'Fair',        tone: 'warning' },
    admin:       { label: 'Admin',       tone: 'warning' },
    resident:    { label: 'Resident',    tone: 'info' }
  };

  function badge(status) {
    var s = STATUS[status] || { label: status, tone: 'neutral' };
    return el('span', { class: 'badge badge--' + s.tone, text: s.label });
  }

  function label(status) { return (STATUS[status] || { label: status }).label; }

  /* ------------------------------------------------------------------ */
  /* Session (who is signed in)                                          */
  /* The JWT is the real proof of identity: the backend checks it on     */
  /* every request. The stored user is only used to draw the page.       */
  /* ------------------------------------------------------------------ */
  var root = document.body.getAttribute('data-root') || '';

  function loginUrl() { return root + 'login.html'; }
  function homeUrl(role) { return root + (role === 'admin' ? 'admin/' : 'resident/') + 'dashboard.html'; }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (err) { return null; }
  }

  function setSession(token, user) {
    try {
      if (token) localStorage.setItem(window.api.TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) { /* storage may be unavailable */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(window.api.TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (err) { /* storage may be unavailable */ }
  }

  /**
   * Make sure the right kind of user is on this page.
   * This only improves the experience; it is NOT access control.
   * The backend still returns 401/403 for every protected endpoint.
   */
  function requireRole(role) {
    var user = getUser();
    if (window.APP_CONFIG.USE_MOCK && (!user || user.role !== role)) {
      // Sample mode: switch to the demo account for this area so every page can be reviewed
      user = window.mock.demoUser(role);
      setSession('mock-token', user);
      return user;
    }
    if (!user) { window.location.replace(loginUrl()); return null; }
    if (user.role !== role) { window.location.replace(homeUrl(user.role)); return null; }
    return user;
  }

  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
  }

  function renderUserChip(user) {
    if (!user || !$('user-chip-name')) return;
    $('user-chip-name').textContent = user.name;
    $('user-avatar').textContent = initials(user.name);
    var pill = $('user-role');
    if (pill) pill.hidden = user.role !== 'admin';
  }

  /* ------------------------------------------------------------------ */
  /* Mobile menu + logout                                                */
  /* ------------------------------------------------------------------ */
  function setupNav() {
    var toggle = document.querySelector('.topbar__toggle');
    var nav = $('site-nav');
    if (!toggle || !nav) return;
    var mq = window.matchMedia('(min-width: 1121px)');

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      clear(toggle);
      toggle.appendChild(icon(open ? 'close' : 'menu'));
    }

    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    mq.addEventListener('change', function (e) { if (e.matches) setOpen(false); });
  }

  function setupLogout() {
    document.querySelectorAll('[data-logout]').forEach(function (link) {
      link.addEventListener('click', function () { clearSession(); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Start: runs on every page before the page's own script              */
  /* ------------------------------------------------------------------ */
  var pageRole = document.body.getAttribute('data-role');   // 'resident' | 'admin' | null
  var currentUser = pageRole ? requireRole(pageRole) : getUser();

  setupNav();
  setupLogout();
  renderUserChip(currentUser);

  window.ui = {
    $: $, el: el, icon: icon, clear: clear, toast: toast, empty: empty, emptyRow: emptyRow,
    fieldError: fieldError, busy: busy, chips: chips, fillSelect: fillSelect,
    fmtShort: fmtShort, fmtLong: fmtLong, fmtDay: fmtDay, fmtDateTime: fmtDateTime,
    startOfDay: startOfDay, addDays: addDays, diffDays: diffDays, isoDate: isoDate, parseDay: parseDay, relativeDay: relativeDay,
    STATUS: STATUS, badge: badge, label: label,
    user: currentUser, getUser: getUser, setSession: setSession, clearSession: clearSession,
    renderUserChip: renderUserChip, loginUrl: loginUrl, homeUrl: homeUrl
  };
})();
