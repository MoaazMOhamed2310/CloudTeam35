/* ==========================================================================
   resident/plots.js  -  Browse plots (owner: Moaaz)
   Function: list and view plots, filter by status
   GET /api/plots?status=available|assigned|maintenance
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var plots = [];

  var currentStatus = ui.chips('status-chips', 'status', render);
  $('plot-search').addEventListener('input', render);

  function plotTile(plot) {
    return el('article', { class: 'tile plot-tile plot-tile--' + plot.status },
      el('div', { class: 'tile__head' },
        el('span', { class: 'row__icon', 'aria-hidden': 'true' }, ui.icon(plot.status === 'maintenance' ? 'tool' : 'sprout')),
        el('div', {},
          el('h3', { class: 'tile__title', text: 'Plot ' + plot.label }),
          el('p', { class: 'row__meta', text: plot.location }))),
      el('div', { class: 'tile__meta' },
        el('span', { text: 'Size: ' + plot.size })),
      el('div', { class: 'tile__foot' },
        ui.badge(plot.status),
        plot.status === 'available'
          ? el('a', { class: 'btn btn--outline btn--sm', href: 'applications.html#new' }, 'Apply')
          : null));
  }

  function render() {
    var grid = $('plots-grid');
    var status = currentStatus();
    var term = $('plot-search').value.trim().toLowerCase();

    var shown = plots.filter(function (p) {
      var matchesStatus = !status || p.status === status;
      var matchesText = !term || (p.label + ' ' + p.location).toLowerCase().indexOf(term) !== -1;
      return matchesStatus && matchesText;
    });

    ui.clear(grid);
    if (!shown.length) grid.appendChild(ui.empty('No plots found', 'Try another filter or search.'));
    shown.forEach(function (p) { grid.appendChild(plotTile(p)); });

    var free = plots.filter(function (p) { return p.status === 'available'; }).length;
    $('plots-count').textContent = 'Showing ' + shown.length + ' of ' + plots.length + ' plots · ' + free + ' available';
  }

  window.api.get('/plots')
    .then(function (data) { plots = data; render(); })
    .catch(function (err) {
      ui.clear($('plots-grid'));
      $('plots-grid').appendChild(ui.empty('Could not load plots', err.message));
    });
})();
