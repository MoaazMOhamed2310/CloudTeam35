/* ==========================================================================
   admin/plots.js  -  Manage plots (owner: Moaaz)
   Functions:
     GET   /api/plots               all plots
     PATCH /api/plots/:id/status    { status: available|assigned|maintenance }  (admin)
     GET   /api/applications        to show who each plot is assigned to
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var plots = [];
  var holders = {};   // plotId -> resident name (from approved applications)

  var currentStatus = ui.chips('status-chips', 'status', render);
  $('plot-search').addEventListener('input', render);

  function statusSelect(plot) {
    var id = 'status-' + plot.id;
    var select = el('select', { class: 'select select--sm', id: id },
      el('option', { value: 'available', text: 'Available' }),
      el('option', { value: 'assigned', text: 'Assigned' }),
      el('option', { value: 'maintenance', text: 'Maintenance' }));
    select.value = plot.status;
    select.addEventListener('change', function () { updateStatus(plot, select); });
    return el('div', {}, el('label', { class: 'visually-hidden', for: id, text: 'Status of plot ' + plot.label }), select);
  }

  function render() {
    var body = $('plots-body');
    var status = currentStatus();
    var term = $('plot-search').value.trim().toLowerCase();
    var shown = plots.filter(function (p) {
      return (!status || p.status === status) && (!term || (p.label + ' ' + p.location).toLowerCase().indexOf(term) !== -1);
    });

    ui.clear(body);
    if (!shown.length) body.appendChild(ui.emptyRow(6, 'No plots found', 'Try another filter.'));
    shown.forEach(function (p) {
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Plot', class: 'table__strong', text: p.label }),
        el('td', { 'data-label': 'Size', class: 'table__nowrap', text: p.size }),
        el('td', { 'data-label': 'Location', text: p.location }),
        el('td', { 'data-label': 'Assigned to', text: holders[p.id] || '–' }),
        el('td', { 'data-label': 'Status' }, ui.badge(p.status)),
        el('td', { 'data-label': 'Change status' }, statusSelect(p))));
    });
    $('plots-count').textContent = 'Showing ' + shown.length + ' of ' + plots.length + ' plots';
  }

  function updateStatus(plot, select) {
    var previous = plot.status;
    select.disabled = true;
    window.api.patch('/plots/' + plot.id + '/status', { status: select.value })
      .then(function (updated) {
        Object.assign(plot, updated);
        ui.toast('Plot ' + plot.label + ' is now ' + ui.label(plot.status).toLowerCase() + '.');
        render();
      })
      .catch(function (err) {
        select.value = previous;
        select.disabled = false;
        ui.toast(err.message, true);
      });
  }

  Promise.all([window.api.get('/plots'), window.api.get('/applications')])
    .then(function (r) {
      plots = r[0];
      r[1].filter(function (a) { return a.status === 'approved' && a.assignedPlotId; })
        .forEach(function (a) { if (!holders[a.assignedPlotId]) holders[a.assignedPlotId] = a.userName; });
      render();
    })
    .catch(function (err) {
      ui.clear($('plots-body'));
      $('plots-body').appendChild(ui.emptyRow(6, 'Could not load plots', err.message));
    });
})();
