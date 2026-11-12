/* ==========================================================================
   admin/audit-logs.js  -  Audit log viewer (owner: Mahmoud, logging lead)
   GET /api/audit-logs   (admin only; residents get 403 from the API)
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var logs = [];

  var search = $('log-search');
  var action = $('log-action');
  search.addEventListener('input', render);
  action.addEventListener('change', render);

  function render() {
    var body = $('log-body');
    var term = search.value.trim().toLowerCase();
    var shown = logs.filter(function (l) {
      return (!action.value || l.action === action.value)
        && (!term || (l.userName + ' ' + l.details).toLowerCase().indexOf(term) !== -1);
    });

    ui.clear(body);
    if (!shown.length) body.appendChild(ui.emptyRow(4, 'No entries found', 'Try another search or action.'));
    shown.forEach(function (l) {
      var failed = l.action.indexOf('failed') !== -1;
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Time', class: 'table__nowrap', text: ui.fmtDateTime.format(new Date(l.timestamp)) }),
        el('td', { 'data-label': 'User', class: 'table__strong', text: l.userName }),
        el('td', { 'data-label': 'Action' }, el('span', { class: 'badge badge--' + (failed ? 'danger' : 'neutral'), text: l.action })),
        el('td', { 'data-label': 'Details', text: l.details })));
    });

    var failedCount = logs.filter(function (l) { return l.action.indexOf('failed') !== -1; }).length;
    $('log-count').textContent = 'Showing ' + shown.length + ' of ' + logs.length + ' entries · ' + failedCount + ' failed sign-ins';
  }

  window.api.get('/audit-logs')
    .then(function (data) {
      logs = data;
      var actions = logs.map(function (l) { return l.action; })
        .filter(function (a, i, all) { return all.indexOf(a) === i; }).sort();
      ui.fillSelect(action, actions.map(function (a) { return { value: a, text: a }; }), true);
      render();
    })
    .catch(function (err) {
      ui.clear($('log-body'));
      $('log-body').appendChild(ui.emptyRow(4, 'Could not load the audit log', err.message));
    });
})();
