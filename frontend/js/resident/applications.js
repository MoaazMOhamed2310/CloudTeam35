/* ==========================================================================
   resident/applications.js  -  Apply for a plot + my applications (owner: Moaaz)
   Functions:
     POST  /api/applications               { season, note, turnstileToken } -> 201
     GET   /api/applications               own applications (resident)
     PATCH /api/applications/:id/withdraw  only while pending
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var applications = [];

  var form = $('application-form');
  var season = $('season');
  var note = $('note');
  var formError = $('application-form-error');
  var bot = window.turnstileBox.mount('application-turnstile');
  var currentStatus = ui.chips('app-chips', 'status', render);

  /* ---------------- Table ---------------- */
  function render() {
    var body = $('apps-body');
    var status = currentStatus();
    var shown = applications.filter(function (a) { return !status || a.status === status; });
    ui.clear(body);

    if (!shown.length) body.appendChild(ui.emptyRow(6, 'No applications here', status ? 'Try another filter.' : 'Use the form to apply for a plot.'));

    shown.forEach(function (app) {
      var action = el('td', { class: 'table__actions' });
      if (app.status === 'pending') {
        var btn = el('button', {
          class: 'btn btn--outline btn--sm', type: 'button',
          'aria-label': 'Withdraw application for ' + app.season,
          onClick: function () { withdraw(app, btn); }
        }, 'Withdraw');
        action.appendChild(btn);
      }
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Season', class: 'table__strong table__nowrap', text: app.season }),
        el('td', { 'data-label': 'Note', text: app.note || '–' }),
        el('td', { 'data-label': 'Status' }, ui.badge(app.status)),
        el('td', { 'data-label': 'Plot', class: 'table__nowrap', text: app.plotLabel || '–' }),
        el('td', { 'data-label': 'Submitted', text: ui.fmtShort.format(new Date(app.createdAt)) }),
        action));
    });

    $('apps-count').textContent = 'Showing ' + shown.length + ' of ' + applications.length + ' applications';
  }

  function load() {
    return window.api.get('/applications').then(function (data) { applications = data; render(); });
  }

  /* ---------------- Form ---------------- */
  note.addEventListener('input', function () {
    $('note-count').textContent = note.value.length + ' / 300';
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    formError.textContent = '';

    // Client-side checks are only for a nicer experience; the API validates again
    var seasonMsg = season.value ? '' : 'Please choose a season.';
    var noteMsg = note.value.length <= 300 ? '' : 'Keep the note under 300 characters.';
    ui.fieldError(season, seasonMsg);
    ui.fieldError(note, noteMsg);
    if (seasonMsg || noteMsg) return;

    var token = bot.getToken();
    if (!token) { formError.textContent = 'Please complete the bot check.'; return; }

    var button = form.querySelector('button[type="submit"]');
    ui.busy(button, true);
    window.api.post('/applications', { season: season.value, note: note.value.trim(), turnstileToken: token })
      .then(function () {
        form.reset();
        $('note-count').textContent = '0 / 300';
        ui.toast('Application submitted. The committee will review it.');
        return load();
      })
      .catch(function (err) { formError.textContent = err.message; })
      .finally(function () { ui.busy(button, false); bot.reset(); });
  });

  /* ---------------- Withdraw ---------------- */
  function withdraw(app, button) {
    ui.busy(button, true);
    window.api.patch('/applications/' + app.id + '/withdraw')
      .then(function (updated) {
        Object.assign(app, updated);
        render();
        ui.toast('Application withdrawn.');
      })
      .catch(function (err) { ui.busy(button, false); ui.toast(err.message, true); });
  }

  load().catch(function (err) {
    ui.clear($('apps-body'));
    $('apps-body').appendChild(ui.emptyRow(6, 'Could not load applications', err.message));
  });

  // Coming from "Apply for a plot" buttons: jump to the form
  if (window.location.hash === '#new') season.focus();
})();
