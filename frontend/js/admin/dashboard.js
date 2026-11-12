/* ==========================================================================
   admin/dashboard.js  -  Committee dashboard (owner: Moaaz, integration)
   Reads: /api/applications, /api/plots, /api/loans, /api/duties, /api/audit-logs
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;

  // Overdue = still pending and the date has passed
  function isOverdue(d) { return d.status === 'pending' && ui.diffDays(ui.parseDay(d.dutyDate)) < 0; }

  function renderKpis(apps, plots, loans, duties) {
    $('kpi-pending').textContent = apps.filter(function (a) { return a.status === 'pending'; }).length;
    $('kpi-available').textContent = plots.filter(function (p) { return p.status === 'available'; }).length;
    $('kpi-loans').textContent = loans.filter(function (l) { return l.status === 'on_loan'; }).length;
    $('kpi-overdue').textContent = duties.filter(isOverdue).length;
  }

  function renderWaiting(apps) {
    var list = $('waiting-list');
    ui.clear(list);
    var pending = apps.filter(function (a) { return a.status === 'pending'; }).slice(0, 4);
    if (!pending.length) { list.appendChild(el('li', {}, ui.empty('All caught up', 'No applications are waiting.'))); return; }
    pending.forEach(function (a) {
      list.appendChild(el('li', { class: 'row' },
        el('span', { class: 'row__icon', 'aria-hidden': 'true' }, ui.icon('user')),
        el('div', { class: 'row__body' },
          el('p', { class: 'row__title', text: a.userName + ' · ' + a.season }),
          el('p', { class: 'row__meta', text: (a.note || 'No note') + ' · ' + ui.relativeDay(new Date(a.createdAt)).toLowerCase() })),
        el('a', { class: 'btn btn--outline btn--sm', href: 'applications.html' }, 'Review')));
    });
  }

  function renderGlance(plots) {
    var counts = ['available', 'assigned', 'maintenance'].map(function (s) {
      return plots.filter(function (p) { return p.status === s; }).length;
    });
    var total = plots.length;
    var segments = $('plots-bar').children;
    counts.forEach(function (c, i) { segments[i].style.width = (total ? (c / total) * 100 : 0) + '%'; });
    $('plots-bar').setAttribute('aria-label', counts[0] + ' available, ' + counts[1] + ' assigned, ' + counts[2] + ' in maintenance, out of ' + total + ' plots');

    var legend = $('plots-legend');
    ui.clear(legend);
    ['Available', 'Assigned', 'Maintenance'].forEach(function (name, i) {
      legend.appendChild(el('li', {},
        el('span', { class: 'legend__dot segbar__' + name.toLowerCase(), 'aria-hidden': 'true' }),
        name,
        el('span', { class: 'legend__count', text: String(counts[i]) })));
    });
  }

  function renderActivity(logs) {
    var list = $('activity-list');
    ui.clear(list);
    logs.slice(0, 6).forEach(function (log) {
      var failed = log.action.indexOf('failed') !== -1;
      list.appendChild(el('li', { class: 'row' + (failed ? ' row--overdue' : '') },
        el('span', { class: 'row__icon', 'aria-hidden': 'true' }, ui.icon(failed ? 'alert' : 'shield')),
        el('div', { class: 'row__body' },
          el('p', { class: 'row__title', text: log.details }),
          el('p', { class: 'row__meta', text: log.userName + ' · ' + ui.fmtDateTime.format(new Date(log.timestamp)) }))));
    });
  }

  var today = $('today');
  today.textContent = ui.fmtLong.format(new Date());
  today.setAttribute('datetime', ui.isoDate(new Date()));

  Promise.all([
    window.api.get('/applications'),
    window.api.get('/plots'),
    window.api.get('/loans'),
    window.api.get('/duties'),
    window.api.get('/audit-logs')
  ]).then(function (r) {
    renderKpis(r[0], r[1], r[2], r[3]);
    renderWaiting(r[0]);
    renderGlance(r[1]);
    renderActivity(r[4]);
  }).catch(function (err) {
    console.error(err);
    ui.toast('Could not load the dashboard. Please refresh.', true);
  });
})();
