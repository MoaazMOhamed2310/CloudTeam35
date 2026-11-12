/* ==========================================================================
   mock.js  -  Sample data + a tiny fake backend (SHARED)
   While APP_CONFIG.USE_MOCK is true, api.js sends every request here instead
   of the network. It answers the same endpoints, status codes and error
   format as the real Express API, so the page scripts never change: when the
   backend is ready, set USE_MOCK = false in config.js.

   The data is kept in sessionStorage, so an action on one page (for example
   applying for a plot) shows up on another page (the admin review list).
   Close the tab to start again from the original sample data.
   ========================================================================== */
(function () {
  'use strict';

  var DB_KEY = 'cgp_mock_db';
  var DAY_MS = 86400000;

  /* ---------- date helpers (ISO strings, like a real JSON API) ---------- */
  function day(n) {
    var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function stamp(nDays, hour) {
    var d = new Date(Date.now() + nDays * DAY_MS); d.setHours(hour || 10, 15, 0, 0);
    return d.toISOString();
  }

  /* ---------- the original sample data ---------- */
  function seed() {
    var plots = [];
    [
      ['A-01', 'assigned'], ['A-02', 'assigned'], ['A-03', 'available'], ['A-04', 'assigned'], ['A-05', 'available'], ['A-06', 'available'],
      ['B-10', 'assigned'], ['B-11', 'assigned'], ['B-12', 'assigned'], ['B-13', 'assigned'], ['B-14', 'available'],
      ['C-20', 'assigned'], ['C-21', 'assigned'], ['C-22', 'assigned'], ['C-23', 'available'], ['C-24', 'maintenance'], ['C-25', 'available'],
      ['D-30', 'assigned'], ['D-31', 'available'], ['D-32', 'maintenance']
    ].forEach(function (p, i) {
      var bed = { A: 'North bed, near the gate', B: 'East bed, full sun', C: 'South bed, partial shade', D: 'Shed corner' }[p[0].charAt(0)];
      plots.push({ id: i + 1, label: p[0], size: ['3 × 2 m', '3 × 4 m', '2 × 2 m'][i % 3], location: bed, status: p[1] });
    });

    return {
      nextId: 100,
      users: [
        { id: 1, name: 'Garden Admin',  email: 'admin@garden.test', role: 'admin' },
        { id: 2, name: 'Amira Hassan',  email: 'amira@garden.test', role: 'resident' },
        { id: 3, name: 'Sara Ahmed',    email: 'sara@garden.test',  role: 'resident' },
        { id: 4, name: 'Omar Khaled',   email: 'omar@garden.test',  role: 'resident' },
        { id: 5, name: 'Nour Ali',      email: 'nour@garden.test',  role: 'resident' },
        { id: 6, name: 'Youssef Adel',  email: 'youssef@garden.test', role: 'resident' }
      ],
      plots: plots,
      applications: [
        { id: 14, userId: 2, season: 'Winter 2026', note: 'Would like a second plot for herbs', status: 'pending',   assignedPlotId: null, createdAt: stamp(-3) },
        { id: 9,  userId: 2, season: 'Autumn 2026', note: 'Sunny corner, raised bed please',   status: 'approved',  assignedPlotId: 9,    createdAt: stamp(-48) },
        { id: 6,  userId: 2, season: 'Summer 2026', note: 'Vegetables for the family',         status: 'withdrawn', assignedPlotId: null, createdAt: stamp(-170) },
        { id: 4,  userId: 2, season: 'Spring 2026', note: 'Any free plot is fine',             status: 'rejected',  assignedPlotId: null, createdAt: stamp(-230) },
        { id: 15, userId: 3, season: 'Winter 2026', note: 'First time gardener, happy with any plot.', status: 'pending', assignedPlotId: null, createdAt: stamp(-2) },
        { id: 16, userId: 4, season: 'Winter 2026', note: 'A plot close to the water tap please', status: 'pending', assignedPlotId: null, createdAt: stamp(-1) },
        { id: 12, userId: 5, season: 'Winter 2026', note: 'Same plot as last season if possible', status: 'approved', assignedPlotId: 4, createdAt: stamp(-10) },
        { id: 13, userId: 6, season: 'Winter 2026', note: 'Second plot for a school project',   status: 'rejected', assignedPlotId: null, createdAt: stamp(-8) }
      ],
      tools: [
        { id: 1,  name: 'Garden fork',         category: 'Digging',    condition: 'good' },
        { id: 2,  name: 'Spade',               category: 'Digging',    condition: 'good' },
        { id: 3,  name: 'Garden rake',         category: 'Hand tools', condition: 'good' },
        { id: 4,  name: 'Wheelbarrow',         category: 'Transport',  condition: 'fair' },
        { id: 5,  name: 'Pruning shears',      category: 'Cutting',    condition: 'damaged' },
        { id: 6,  name: 'Watering can (10 L)', category: 'Watering',   condition: 'good' },
        { id: 7,  name: 'Hose reel (25 m)',    category: 'Watering',   condition: 'fair' },
        { id: 8,  name: 'Hand trowel',         category: 'Hand tools', condition: 'good' },
        { id: 9,  name: 'Hedge trimmer',       category: 'Cutting',    condition: 'good' },
        { id: 10, name: 'Soil pH tester',      category: 'Testing',    condition: 'good' }
      ],
      loans: [
        { id: 31, toolId: 1,  userId: 2, checkoutDate: stamp(-3), returnDate: null,      status: 'on_loan',  returnCondition: null },
        { id: 33, toolId: 6,  userId: 2, checkoutDate: stamp(-1), returnDate: null,      status: 'on_loan',  returnCondition: null },
        { id: 28, toolId: 3,  userId: 2, checkoutDate: stamp(-20), returnDate: stamp(-18), status: 'returned', returnCondition: 'good' },
        { id: 29, toolId: 4,  userId: 4, checkoutDate: stamp(-4), returnDate: null,      status: 'on_loan',  returnCondition: null },
        { id: 30, toolId: 10, userId: 3, checkoutDate: stamp(-2), returnDate: null,      status: 'on_loan',  returnCondition: null },
        { id: 25, toolId: 5,  userId: 6, checkoutDate: stamp(-15), returnDate: stamp(-12), status: 'returned', returnCondition: 'damaged' }
      ],
      duties: [
        { id: 51, plotId: 9,  assignedUserId: 2, dutyDate: day(-2), status: 'pending',   completedAt: null },
        { id: 52, plotId: 9,  assignedUserId: 2, dutyDate: day(0),  status: 'pending',   completedAt: null },
        { id: 53, plotId: 9,  assignedUserId: 2, dutyDate: day(3),  status: 'pending',   completedAt: null },
        { id: 54, plotId: 9,  assignedUserId: 2, dutyDate: day(9),  status: 'pending',   completedAt: null },
        { id: 49, plotId: 9,  assignedUserId: 2, dutyDate: day(-1), status: 'completed', completedAt: stamp(-1, 18) },
        { id: 55, plotId: 4,  assignedUserId: 5, dutyDate: day(1),  status: 'pending',   completedAt: null },
        { id: 56, plotId: 12, assignedUserId: 3, dutyDate: day(-1), status: 'pending',   completedAt: null },
        { id: 57, plotId: 7,  assignedUserId: 4, dutyDate: day(2),  status: 'pending',   completedAt: null },
        { id: 58, plotId: 1,  assignedUserId: 3, dutyDate: day(-3), status: 'completed', completedAt: stamp(-3, 8) }
      ],
      auditLogs: [
        { id: 1,  userId: 2, action: 'login',              details: 'Signed in',                         timestamp: stamp(0, 9) },
        { id: 2,  userId: 4, action: 'application.create', details: 'Applied for Winter 2026',           timestamp: stamp(-1, 11) },
        { id: 3,  userId: 1, action: 'application.assign', details: 'Assigned plot A-04 to Nour Ali',    timestamp: stamp(-1, 9) },
        { id: 4,  userId: null, action: 'login.failed',    details: 'Wrong password for sara@garden.test', timestamp: stamp(-1, 8) },
        { id: 5,  userId: 2, action: 'tool.checkout',      details: 'Borrowed Watering can (10 L)',      timestamp: stamp(-1, 17) },
        { id: 6,  userId: 3, action: 'tool.checkout',      details: 'Borrowed Soil pH tester',           timestamp: stamp(-2, 16) },
        { id: 7,  userId: 1, action: 'plot.status',        details: 'C-24 set to maintenance',           timestamp: stamp(-4, 12) },
        { id: 8,  userId: 6, action: 'loan.return',        details: 'Returned Pruning shears (damaged)', timestamp: stamp(-12, 15) },
        { id: 9,  userId: 1, action: 'duty.create',        details: 'Water plot B-12 assigned to Amira Hassan', timestamp: stamp(-5, 10) },
        { id: 10, userId: 3, action: 'duty.complete',      details: 'Water plot A-01 completed',         timestamp: stamp(-3, 8) }
      ]
    };
  }

  /* Seven days of sample weather, starting today (shape of the Open-Meteo answer our backend returns) */
  function forecastDays() {
    var rain = [70, 20, 10, 55, 30, 80, 15];
    var desc = ['Light rain showers', 'Partly cloudy', 'Sunny', 'Showers likely', 'Cloudy', 'Rain', 'Sunny'];
    return rain.map(function (r, i) {
      return { date: day(i), tempMin: 13 + (i % 3), tempMax: 20 + (i % 4), rainChance: r, description: desc[i], rainExpected: r >= 50 };
    });
  }

  /* ---------- storage ---------- */
  var db;
  function load() {
    try { db = JSON.parse(sessionStorage.getItem(DB_KEY)); } catch (err) { db = null; }
    if (!db) { db = seed(); save(); }
  }
  function save() { try { sessionStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (err) { /* ignore */ } }
  load();

  /* ---------- helpers ---------- */
  function fail(status, message) { var e = new Error(message); e.status = status; return e; }
  function me() { try { return JSON.parse(localStorage.getItem('cgp_user')); } catch (e) { return null; } }
  function find(list, id) { return list.filter(function (x) { return x.id === Number(id); })[0]; }
  function nextId() { db.nextId += 1; return db.nextId; }
  function userName(id) { var u = find(db.users, id); return u ? u.name : 'Unknown'; }
  function plotLabel(id) { var p = find(db.plots, id); return p ? p.label : null; }
  function log(userId, action, details) {
    db.auditLogs.unshift({ id: nextId(), userId: userId, action: action, details: details, timestamp: new Date().toISOString() });
  }
  function text(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

  function toolStatus(tool) {
    if (tool.condition === 'damaged') return 'damaged';
    var onLoan = db.loans.some(function (l) { return l.toolId === tool.id && l.status === 'on_loan'; });
    return onLoan ? 'on_loan' : 'available';
  }
  function toolOut(t) { return Object.assign({}, t, { status: toolStatus(t), available: toolStatus(t) === 'available' }); }
  function appOut(a) { return Object.assign({}, a, { userName: userName(a.userId), plotLabel: plotLabel(a.assignedPlotId) }); }
  function loanOut(l) {
    var t = find(db.tools, l.toolId);
    return Object.assign({}, l, { toolName: t.name, category: t.category, userName: userName(l.userId) });
  }
  function dutyOut(d) {
    var f = forecastDays().filter(function (x) { return x.date === d.dutyDate; })[0];
    return Object.assign({}, d, { plotLabel: plotLabel(d.plotId), assigneeName: userName(d.assignedUserId), rainExpected: f ? f.rainExpected : false });
  }

  /* ---------- the fake endpoints (same as the API contract) ---------- */
  function handle(method, fullPath, body) {
    var parts = fullPath.split('?');
    var path = parts[0];
    var query = new URLSearchParams(parts[1] || '');
    var user = me();
    var isAdmin = user && user.role === 'admin';
    var m;
    body = body || {};

    function needLogin() { if (!user) throw fail(401, 'Please sign in.'); }
    function needAdmin() { needLogin(); if (!isAdmin) throw fail(403, 'Only admins can do this.'); }
    function needResident() { needLogin(); if (isAdmin) throw fail(403, 'Only residents can do this.'); }

    /* ----- Auth ----- */
    if (method === 'POST' && path === '/auth/login') {
      var email = text(body.email, 120).toLowerCase();
      var found = db.users.filter(function (u) { return u.email === email; })[0];
      if (!found || text(body.password, 200).length < 8) {
        log(null, 'login.failed', 'Failed sign-in for ' + (email || 'unknown email'));
        save();
        throw fail(401, 'Email or password is incorrect.');
      }
      log(found.id, 'login', 'Signed in');
      save();
      return { token: 'mock-token', user: found };
    }
    if (method === 'POST' && path === '/auth/register') {
      var name = text(body.name, 80);
      var newEmail = text(body.email, 120).toLowerCase();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || text(body.password, 200).length < 8) {
        throw fail(400, 'Name, a valid email and a password of at least 8 characters are required.');
      }
      if (!body.turnstileToken) throw fail(403, 'Bot check failed. Please try again.');
      if (db.users.some(function (u) { return u.email === newEmail; })) throw fail(409, 'An account with this email already exists.');
      var created = { id: nextId(), name: name, email: newEmail, role: 'resident' };
      db.users.push(created);
      log(created.id, 'register', 'Created a resident account');
      save();
      return { token: 'mock-token', user: created };
    }

    needLogin();

    /* ----- Users (admin: pick an assignee) ----- */
    if (method === 'GET' && path === '/users') {
      needAdmin();
      return db.users.filter(function (u) { return !query.get('role') || u.role === query.get('role'); });
    }

    /* ----- Plots & Applications (Moaaz) ----- */
    if (method === 'GET' && path === '/plots') {
      var status = query.get('status');
      return db.plots.filter(function (p) { return !status || p.status === status; });
    }
    if (method === 'PATCH' && (m = path.match(/^\/plots\/(\d+)\/status$/))) {
      needAdmin();
      var plot = find(db.plots, m[1]);
      if (!plot) throw fail(404, 'Plot not found.');
      if (['available', 'assigned', 'maintenance'].indexOf(body.status) === -1) throw fail(400, 'Status must be available, assigned or maintenance.');
      plot.status = body.status;
      log(user.id, 'plot.status', plot.label + ' set to ' + body.status);
      save();
      return plot;
    }
    if (method === 'GET' && path === '/applications') {
      return db.applications
        .filter(function (a) { return isAdmin || a.userId === user.id; })
        .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); })
        .map(appOut);
    }
    if (method === 'POST' && path === '/applications') {
      needResident();
      var season = text(body.season, 40);
      var note = text(body.note, 300);
      if (!season) throw fail(400, 'Please choose a season.');
      if (!body.turnstileToken) throw fail(403, 'Bot check failed. Please try again.');
      var duplicate = db.applications.some(function (a) {
        return a.userId === user.id && a.season === season && (a.status === 'pending' || a.status === 'approved');
      });
      if (duplicate) throw fail(409, 'You already have an active application for ' + season + '.');
      var app = { id: nextId(), userId: user.id, season: season, note: note, status: 'pending', assignedPlotId: null, createdAt: new Date().toISOString() };
      db.applications.push(app);
      log(user.id, 'application.create', 'Applied for ' + season);
      save();
      return appOut(app);
    }
    if (method === 'PATCH' && (m = path.match(/^\/applications\/(\d+)\/assign$/))) {
      needAdmin();
      var toAssign = find(db.applications, m[1]);
      var target = find(db.plots, body.plotId);
      if (!toAssign) throw fail(404, 'Application not found.');
      if (!target) throw fail(400, 'Please choose a plot.');
      if (toAssign.status !== 'pending') throw fail(409, 'Only pending applications can be approved.');
      if (target.status !== 'available') throw fail(409, 'Plot ' + target.label + ' is not available.');
      toAssign.status = 'approved';
      toAssign.assignedPlotId = target.id;
      target.status = 'assigned';
      log(user.id, 'application.assign', 'Assigned plot ' + target.label + ' to ' + userName(toAssign.userId));
      save();
      return appOut(toAssign);
    }
    if (method === 'PATCH' && (m = path.match(/^\/applications\/(\d+)\/reject$/))) {
      needAdmin();
      var toReject = find(db.applications, m[1]);
      if (!toReject) throw fail(404, 'Application not found.');
      if (toReject.status !== 'pending') throw fail(409, 'Only pending applications can be rejected.');
      toReject.status = 'rejected';
      log(user.id, 'application.reject', 'Rejected application from ' + userName(toReject.userId));
      save();
      return appOut(toReject);
    }
    if (method === 'PATCH' && (m = path.match(/^\/applications\/(\d+)\/withdraw$/))) {
      var toWithdraw = find(db.applications, m[1]);
      if (!toWithdraw || toWithdraw.userId !== user.id) throw fail(404, 'Application not found.');   // never reveal other residents' records
      if (toWithdraw.status !== 'pending') throw fail(409, 'Only pending applications can be withdrawn.');
      toWithdraw.status = 'withdrawn';
      log(user.id, 'application.withdraw', 'Withdrew application for ' + toWithdraw.season);
      save();
      return appOut(toWithdraw);
    }

    /* ----- Shared Tools & Loans (Mayan) ----- */
    if (method === 'GET' && path === '/tools') {
      var search = (query.get('search') || '').toLowerCase();
      var category = query.get('category');
      return db.tools
        .filter(function (t) { return (!search || t.name.toLowerCase().indexOf(search) !== -1) && (!category || t.category === category); })
        .map(toolOut);
    }
    if (method === 'POST' && path === '/tools') {
      needAdmin();
      var toolName = text(body.name, 80);
      var toolCat = text(body.category, 40);
      if (!toolName || !toolCat) throw fail(400, 'Name and category are required.');
      if (['good', 'fair', 'damaged'].indexOf(body.condition) === -1) throw fail(400, 'Condition must be good, fair or damaged.');
      var tool = { id: nextId(), name: toolName, category: toolCat, condition: body.condition };
      db.tools.push(tool);
      log(user.id, 'tool.create', 'Added ' + toolName);
      save();
      return toolOut(tool);
    }
    if (method === 'PATCH' && (m = path.match(/^\/tools\/(\d+)$/))) {
      needAdmin();
      var toEdit = find(db.tools, m[1]);
      if (!toEdit) throw fail(404, 'Tool not found.');
      if (body.name !== undefined) toEdit.name = text(body.name, 80) || toEdit.name;
      if (body.category !== undefined) toEdit.category = text(body.category, 40) || toEdit.category;
      if (body.condition !== undefined) {
        if (['good', 'fair', 'damaged'].indexOf(body.condition) === -1) throw fail(400, 'Condition must be good, fair or damaged.');
        toEdit.condition = body.condition;
      }
      log(user.id, 'tool.update', 'Updated ' + toEdit.name);
      save();
      return toolOut(toEdit);
    }
    if (method === 'POST' && (m = path.match(/^\/tools\/(\d+)\/checkout$/))) {
      needResident();
      var toBorrow = find(db.tools, m[1]);
      if (!toBorrow) throw fail(404, 'Tool not found.');
      if (toolStatus(toBorrow) !== 'available') throw fail(409, toBorrow.name + ' is not available right now.');
      var loan = { id: nextId(), toolId: toBorrow.id, userId: user.id, checkoutDate: new Date().toISOString(), returnDate: null, status: 'on_loan', returnCondition: null };
      db.loans.push(loan);
      log(user.id, 'tool.checkout', 'Borrowed ' + toBorrow.name);
      save();
      return loanOut(loan);
    }
    if (method === 'POST' && (m = path.match(/^\/tools\/(\d+)\/report$/))) {
      var reported = find(db.tools, m[1]);
      if (!reported) throw fail(404, 'Tool not found.');
      reported.condition = 'damaged';
      log(user.id, 'tool.report', 'Reported ' + reported.name + ' as damaged: ' + (text(body.note, 200) || 'no details'));
      save();
      return toolOut(reported);
    }
    if (method === 'GET' && path === '/loans') {
      return db.loans
        .filter(function (l) { return isAdmin || l.userId === user.id; })
        .sort(function (a, b) { return b.checkoutDate.localeCompare(a.checkoutDate); })
        .map(loanOut);
    }
    if (method === 'PATCH' && (m = path.match(/^\/loans\/(\d+)\/return$/))) {
      var toReturn = find(db.loans, m[1]);
      if (!toReturn || (!isAdmin && toReturn.userId !== user.id)) throw fail(404, 'Loan not found.');
      if (toReturn.status !== 'on_loan') throw fail(409, 'This tool has already been returned.');
      if (['good', 'fair', 'damaged'].indexOf(body.condition) === -1) throw fail(400, 'Please choose the condition of the tool.');
      toReturn.status = 'returned';
      toReturn.returnDate = new Date().toISOString();
      toReturn.returnCondition = body.condition;
      var returnedTool = find(db.tools, toReturn.toolId);
      returnedTool.condition = body.condition;
      log(user.id, 'loan.return', 'Returned ' + returnedTool.name + ' (' + body.condition + ')');
      save();
      return loanOut(toReturn);
    }

    /* ----- Watering Duties (Mahmoud) ----- */
    if (method === 'GET' && path === '/duties/forecast') {
      var days = forecastDays();
      if (query.get('date')) {
        var one = days.filter(function (d) { return d.date === query.get('date'); })[0];
        if (!one) throw fail(400, 'Forecast is only available for the next 7 days.');
        return one;
      }
      return days;
    }
    if (method === 'GET' && path === '/duties') {
      return db.duties
        .filter(function (d) { return isAdmin || d.assignedUserId === user.id; })
        .sort(function (a, b) { return a.dutyDate.localeCompare(b.dutyDate); })
        .map(dutyOut);
    }
    if (method === 'POST' && path === '/duties') {
      needAdmin();
      var dutyPlot = find(db.plots, body.plotId);
      var assignee = find(db.users, body.assignedUserId);
      if (!dutyPlot || !assignee || !/^\d{4}-\d{2}-\d{2}$/.test(body.dutyDate || '')) throw fail(400, 'Plot, date and resident are required.');
      if (body.dutyDate < day(0)) throw fail(400, 'The date cannot be in the past.');
      var duty = { id: nextId(), plotId: dutyPlot.id, assignedUserId: assignee.id, dutyDate: body.dutyDate, status: 'pending', completedAt: null };
      db.duties.push(duty);
      log(user.id, 'duty.create', 'Water plot ' + dutyPlot.label + ' assigned to ' + assignee.name);
      save();
      return dutyOut(duty);
    }
    if (method === 'PATCH' && (m = path.match(/^\/duties\/(\d+)\/complete$/))) {
      var toComplete = find(db.duties, m[1]);
      if (!toComplete || (!isAdmin && toComplete.assignedUserId !== user.id)) throw fail(404, 'Duty not found.');
      if (toComplete.status !== 'pending') throw fail(409, 'This duty is already ' + toComplete.status + '.');
      toComplete.status = 'completed';
      toComplete.completedAt = new Date().toISOString();
      log(user.id, 'duty.complete', 'Water plot ' + plotLabel(toComplete.plotId) + ' completed');
      save();
      return dutyOut(toComplete);
    }
    if (method === 'PATCH' && (m = path.match(/^\/duties\/(\d+)$/))) {
      needAdmin();
      var toChange = find(db.duties, m[1]);
      if (!toChange) throw fail(404, 'Duty not found.');
      if (toChange.status !== 'pending') throw fail(409, 'Only pending duties can be changed.');
      if (body.status === 'cancelled') {
        toChange.status = 'cancelled';
        log(user.id, 'duty.cancel', 'Cancelled watering of ' + plotLabel(toChange.plotId) + ' on ' + toChange.dutyDate);
      } else if (body.assignedUserId) {
        if (!find(db.users, body.assignedUserId)) throw fail(400, 'Resident not found.');
        toChange.assignedUserId = Number(body.assignedUserId);
        log(user.id, 'duty.reassign', 'Watering of ' + plotLabel(toChange.plotId) + ' reassigned to ' + userName(toChange.assignedUserId));
      } else {
        throw fail(400, 'Nothing to change.');
      }
      save();
      return dutyOut(toChange);
    }

    /* ----- Audit logs (admin) ----- */
    if (method === 'GET' && path === '/audit-logs') {
      needAdmin();
      return db.auditLogs.map(function (l) { return Object.assign({}, l, { userName: l.userId ? userName(l.userId) : 'Anonymous' }); });
    }

    throw fail(404, 'No endpoint for ' + method + ' ' + path);
  }

  window.mock = {
    /** Same promise shape as a real fetch: resolves with data or rejects with an Error that has .status */
    request: function (method, path, body) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          load();
          try { resolve(JSON.parse(JSON.stringify(handle(method, path, body)))); } catch (err) { reject(err); }
        }, 150);   // small delay so loading states can be seen
      });
    },
    demoUser: function (role) {
      return role === 'admin' ? db.users[0] : db.users[1];
    },
    reset: function () { sessionStorage.removeItem(DB_KEY); load(); }
  };
})();
