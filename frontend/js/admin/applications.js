/* ==========================================================================
   admin/applications.js  -  Review applications and assign plots (owner: Moaaz)
   Functions:
     GET   /api/applications              all applications (admin)
     PATCH /api/applications/:id/assign   { plotId }  approve + assign, 409 if plot not free
     PATCH /api/applications/:id/reject
     GET   /api/plots?status=available    free plots for the assign list
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var applications = [];
  var freePlots = [];

  var currentStatus = ui.chips('app-chips', 'status', render);
  var seasonFilter = $('season-filter');
  seasonFilter.addEventListener('change', render);

  function decisionCell(app) {
    var cell = el('td', { class: 'table__actions' });
    if (app.status !== 'pending') {
      cell.appendChild(el('span', { class: 'table__sub', text: app.plotLabel ? 'Plot ' + app.plotLabel : '–' }));
      return cell;
    }
    var selectId = 'plot-for-' + app.id;
    var select = el('select', { class: 'select select--sm', id: selectId },
      el('option', { value: '', text: freePlots.length ? 'Choose plot' : 'No free plots' }));
    freePlots.forEach(function (p) { select.appendChild(el('option', { value: String(p.id), text: p.label + ' · ' + p.size })); });

    var approve = el('button', {
      class: 'btn btn--primary btn--sm', type: 'button',
      onClick: function () { assign(app, select, approve); }
    }, 'Approve');
    var reject = el('button', {
      class: 'btn btn--outline btn--sm', type: 'button',
      'aria-label': 'Reject application from ' + app.userName,
      onClick: function () { rejectApp(app, reject); }
    }, 'Reject');

    cell.appendChild(el('div', { class: 'assign-cell' },
      el('label', { class: 'visually-hidden', for: selectId, text: 'Plot for ' + app.userName }),
      select, approve, reject));
    return cell;
  }

  function render() {
    var body = $('apps-body');
    var status = currentStatus();
    var season = seasonFilter.value;
    var shown = applications.filter(function (a) { return (!status || a.status === status) && (!season || a.season === season); });

    ui.clear(body);
    if (!shown.length) body.appendChild(ui.emptyRow(6, status === 'pending' ? 'All caught up' : 'No applications here', status === 'pending' ? 'No applications are waiting for review.' : 'Try another filter.'));
    shown.forEach(function (a) {
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Resident', class: 'table__strong', text: a.userName }),
        el('td', { 'data-label': 'Season', class: 'table__nowrap', text: a.season }),
        el('td', { 'data-label': 'Note', text: a.note || '–' }),
        el('td', { 'data-label': 'Status' }, ui.badge(a.status)),
        el('td', { 'data-label': 'Submitted', class: 'table__nowrap', text: ui.fmtShort.format(new Date(a.createdAt)) }),
        decisionCell(a)));
    });
    $('apps-count').textContent = 'Showing ' + shown.length + ' of ' + applications.length + ' applications';
    $('free-count').textContent = freePlots.length + ' plots free';
  }

  function assign(app, select, button) {
    if (!select.value) { ui.toast('Choose a plot first.', true); select.focus(); return; }
    ui.busy(button, true);
    window.api.patch('/applications/' + app.id + '/assign', { plotId: Number(select.value) })
      .then(function (updated) {
        ui.toast('Approved. Plot ' + updated.plotLabel + ' assigned to ' + app.userName + '.');
        return load();
      })
      .catch(function (err) { ui.busy(button, false); ui.toast(err.message, true); });
  }

  function rejectApp(app, button) {
    ui.busy(button, true);
    window.api.patch('/applications/' + app.id + '/reject')
      .then(function () { ui.toast('Application rejected.'); return load(); })
      .catch(function (err) { ui.busy(button, false); ui.toast(err.message, true); });
  }

  function load() {
    return Promise.all([window.api.get('/applications'), window.api.get('/plots?status=available')])
      .then(function (r) {
        applications = r[0];
        freePlots = r[1];
        var seasons = applications.map(function (a) { return a.season; })
          .filter(function (s, i, all) { return all.indexOf(s) === i; });
        var chosen = seasonFilter.value;
        ui.fillSelect(seasonFilter, seasons.map(function (s) { return { value: s, text: s }; }), true);
        seasonFilter.value = chosen;
        render();
      });
  }

  load().catch(function (err) {
    ui.clear($('apps-body'));
    $('apps-body').appendChild(ui.emptyRow(6, 'Could not load applications', err.message));
  });
})();
