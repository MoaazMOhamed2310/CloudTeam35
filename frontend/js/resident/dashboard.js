/* ==========================================================================
   resident/dashboard.js  -  Resident dashboard (owner: Moaaz, integration)
   Reads from all three services:
     GET /api/applications, GET /api/plots       (Plots & Applications)
     GET /api/loans                              (Shared Tools)
     GET /api/duties, GET /api/duties/forecast   (Watering Duties)
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var state = null;

  /* ---------------- Data ---------------- */
  function loadData() {
    return Promise.all([
      window.api.get('/applications'),
      window.api.get('/plots'),
      window.api.get('/loans'),
      window.api.get('/duties'),
      window.api.get('/duties/forecast?date=' + ui.isoDate(new Date())).catch(function () { return null; })  // weather is optional
    ]).then(function (r) {
      var applications = r[0];
      var plots = r[1];
      // My plot = the plot on my most recent approved application
      var approved = applications.filter(function (a) { return a.status === 'approved' && a.assignedPlotId; })[0];
      var myPlot = approved ? plots.filter(function (p) { return p.id === approved.assignedPlotId; })[0] : null;
      return {
        user: ui.user,
        applications: applications,
        plot: myPlot ? Object.assign({ season: approved.season }, myPlot) : null,
        loans: r[2],
        duties: r[3],
        plotCounts: {
          available: plots.filter(function (p) { return p.status === 'available'; }).length,
          assigned: plots.filter(function (p) { return p.status === 'assigned'; }).length,
          maintenance: plots.filter(function (p) { return p.status === 'maintenance'; }).length
        },
        forecast: r[4]
      };
    });
  }

  /* ---------------- Rendering ---------------- */
  function renderHeader() {
    $('user-name').textContent = state.user.name.split(/\s+/)[0];
    var today = $('today');
    today.textContent = ui.fmtLong.format(new Date());
    today.setAttribute('datetime', ui.isoDate(new Date()));
  }

  function renderPlotAndStats() {
    var plot = state.plot;
    var activeLoans = state.loans.filter(function (l) { return l.status === 'on_loan'; }).length;
    var dueThisWeek = state.duties.filter(function (d) {
      return d.status === 'pending' && ui.diffDays(ui.parseDay(d.dutyDate)) <= 6;
    }).length;

    if (plot) {
      $('plot-label').textContent = plot.label;
      $('plot-sub').textContent = plot.season + ' · ' + plot.size + ' · ' + plot.location;
      $('stat-plot').textContent = ui.label(plot.status);
    } else {
      $('plot-label').textContent = 'none yet';
      $('plot-sub').textContent = 'Apply for a plot to get started.';
      $('stat-plot').textContent = 'No plot';
    }
    $('stat-tools').textContent = String(activeLoans);
    $('stat-duties').textContent = String(dueThisWeek);
  }

  function renderApplications() {
    var body = $('apps-body');
    ui.clear(body);
    var latest = state.applications.slice(0, 3);

    if (!latest.length) body.appendChild(ui.emptyRow(6, 'No applications yet', 'Apply for a plot to see it here.'));

    latest.forEach(function (app) {
      var action = el('td', { class: 'table__actions' });
      if (app.status === 'pending') {
        var btn = el('button', {
          class: 'btn btn--outline btn--sm', type: 'button',
          'aria-label': 'Withdraw application for ' + app.season,
          onClick: function () { withdrawApplication(app, btn); }
        }, 'Withdraw');
        action.appendChild(btn);
      }
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Season', class: 'table__strong table__nowrap', text: app.season }),
        el('td', { 'data-label': 'Note', text: app.note || '–' }),
        el('td', { 'data-label': 'Status' }, ui.badge(app.status)),
        el('td', { 'data-label': 'Plot', class: 'table__nowrap', text: app.plotLabel || '–' }),
        el('td', { 'data-label': 'Submitted', text: ui.fmtShort.format(new Date(app.createdAt)) }),
        action
      ));
    });

    $('apps-count').textContent = 'Showing ' + latest.length + ' of ' + state.applications.length + ' applications';
  }

  function renderLoans() {
    var list = $('loans-list');
    ui.clear(list);
    var active = state.loans.filter(function (l) { return l.status === 'on_loan'; });

    if (!active.length) {
      list.appendChild(el('li', {}, ui.empty('Nothing borrowed', 'Tools you check out will show up here.')));
      return;
    }
    active.forEach(function (loan) {
      list.appendChild(el('li', { class: 'row' },
        el('span', { class: 'row__icon', 'aria-hidden': 'true' }, ui.icon('tool')),
        el('div', { class: 'row__body' },
          el('p', { class: 'row__title', text: loan.toolName }),
          el('p', { class: 'row__meta', text: 'Borrowed ' + ui.relativeDay(new Date(loan.checkoutDate)).toLowerCase() + ' · ' + loan.category })),
        el('a', { class: 'btn btn--outline btn--sm', href: 'loans.html', 'aria-label': 'Return ' + loan.toolName }, 'Return')
      ));
    });
  }

  function renderPlotsGlance() {
    var p = state.plotCounts;
    var total = p.available + p.assigned + p.maintenance;
    var segments = $('plots-bar').children;
    [p.available, p.assigned, p.maintenance].forEach(function (count, i) {
      segments[i].style.width = (total ? (count / total) * 100 : 0) + '%';   // CSSOM is allowed by the CSP
    });
    $('plots-bar').setAttribute('aria-label',
      p.available + ' available, ' + p.assigned + ' assigned, ' + p.maintenance + ' in maintenance, out of ' + total + ' plots');

    var legend = $('plots-legend');
    ui.clear(legend);
    [
      ['Available', p.available, 'segbar__available'],
      ['Assigned', p.assigned, 'segbar__assigned'],
      ['Maintenance', p.maintenance, 'segbar__maintenance']
    ].forEach(function (row) {
      legend.appendChild(el('li', {},
        el('span', { class: 'legend__dot ' + row[2], 'aria-hidden': 'true' }),
        row[0],
        el('span', { class: 'legend__count', text: String(row[1]) })));
    });
  }

  function renderDuties() {
    var open = window.dutiesList.render($('duties-groups'), state.duties, function (duty, button) {
      window.dutiesList.complete(duty, button).then(function () { renderDuties(); renderPlotAndStats(); });
    });
    $('duties-open').textContent = open + ' open';
  }

  function renderWeather() {
    var f = state.forecast;
    if (!f) {
      $('weather-temp').textContent = '–';
      $('weather-desc').textContent = 'Forecast unavailable';
      $('weather-note').textContent = 'Could not reach the weather service. Water as planned.';
      return;
    }
    $('weather-date').textContent = ui.fmtShort.format(ui.parseDay(f.date));
    $('weather-temp').textContent = f.tempMin + ' – ' + f.tempMax + ' °C';
    $('weather-desc').textContent = f.description + ' · ' + f.rainChance + '% chance of rain';
    $('weather-note').textContent = f.rainExpected
      ? 'Rain is expected, so today’s watering is optional. You can skip it.'
      : 'Dry weather expected. Watering duties are on as planned.';
    $('weather-icon').firstElementChild.setAttribute('href', f.rainExpected ? '#i-rain' : '#i-sun');
  }

  function renderAll() {
    renderHeader();
    renderPlotAndStats();
    renderApplications();
    renderLoans();
    renderPlotsGlance();
    renderDuties();
    renderWeather();
  }

  /* ---------------- Actions ---------------- */
  function withdrawApplication(app, button) {
    ui.busy(button, true);
    window.api.patch('/applications/' + app.id + '/withdraw')
      .then(function (updated) {
        Object.assign(app, updated);
        renderApplications();
        ui.toast('Application withdrawn.');
      })
      .catch(function (err) { ui.busy(button, false); ui.toast(err.message, true); });
  }

  /* ---------------- Start ---------------- */
  loadData().then(function (data) {
    state = data;
    renderAll();
  }).catch(function (err) {
    console.error(err);
    ui.toast('Could not load your dashboard. Please refresh.', true);
  });
})();
