/* ==========================================================================
   admin/duties.js  -  Plan the watering rota (owner: Mahmoud)
   Functions:
     POST  /api/duties                  { plotId, assignedUserId, dutyDate }  (admin)
     GET   /api/duties                  all duties (admin)
     PATCH /api/duties/:id              { assignedUserId } reassign, or { status: 'cancelled' }
     GET   /api/duties/forecast?date=   Open-Meteo forecast for one day (502 if the weather API fails)
     GET   /api/users?role=resident     residents for the assignee list
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var duties = [];
  var residents = [];

  var form = $('duty-form');
  var plotSelect = $('duty-plot');
  var userSelect = $('duty-user');
  var dateInput = $('duty-date');
  var formError = $('duty-form-error');
  var forecastBox = $('duty-forecast');

  dateInput.min = ui.isoDate(new Date());
  var currentFilter = ui.chips('duty-chips', 'filter', render);

  /* ---------------- Table ---------------- */
  function matches(d, filter) {
    var overdue = window.dutiesList.isOverdue(d);
    if (filter === 'upcoming') return d.status === 'pending' && !overdue;
    if (filter === 'overdue') return overdue;
    if (filter) return d.status === filter;
    return true;
  }

  function actionsCell(duty) {
    var cell = el('td', { class: 'table__actions' });
    if (duty.status !== 'pending') return cell;

    var selectId = 'reassign-' + duty.id;
    var select = el('select', { class: 'select select--sm', id: selectId });
    residents.forEach(function (r) { select.appendChild(el('option', { value: String(r.id), text: r.name })); });
    select.value = String(duty.assignedUserId);
    select.addEventListener('change', function () { change(duty, { assignedUserId: Number(select.value) }, select, 'Duty reassigned to ' + select.options[select.selectedIndex].text + '.'); });

    var cancelBtn = el('button', {
      class: 'btn btn--ghost btn--sm', type: 'button',
      'aria-label': 'Cancel watering of plot ' + duty.plotLabel + ' on ' + duty.dutyDate,
      onClick: function () { change(duty, { status: 'cancelled' }, cancelBtn, 'Duty cancelled.'); }
    }, 'Cancel');

    cell.appendChild(el('div', { class: 'assign-cell' },
      el('label', { class: 'visually-hidden', for: selectId, text: 'Reassign duty' }), select, cancelBtn));
    return cell;
  }

  function render() {
    var body = $('duties-body');
    var filter = currentFilter();
    var shown = duties.filter(function (d) { return matches(d, filter); });
    if (filter === 'completed' || filter === '') shown = shown.slice().reverse();

    ui.clear(body);
    if (!shown.length) body.appendChild(ui.emptyRow(6, 'No duties here', filter === 'overdue' ? 'Nothing is overdue. Nice.' : 'Create a duty with the form above.'));
    shown.forEach(function (d) {
      var date = ui.parseDay(d.dutyDate);
      var overdue = window.dutiesList.isOverdue(d);
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Date', class: 'table__nowrap' },
          el('span', { class: 'table__strong', text: ui.fmtShort.format(date) }),
          el('span', { class: 'table__sub', text: ui.relativeDay(date) })),
        el('td', { 'data-label': 'Plot', class: 'table__strong', text: d.plotLabel }),
        el('td', { 'data-label': 'Resident', text: d.assigneeName }),
        el('td', { 'data-label': 'Status' }, ui.badge(overdue ? 'overdue' : d.status)),
        el('td', { 'data-label': 'Weather' }, d.rainExpected && d.status === 'pending'
          ? el('span', { class: 'badge badge--info', text: 'Rain – optional' })
          : el('span', { class: 'table__sub', text: '–' })),
        actionsCell(d)));
    });
    var overdueCount = duties.filter(window.dutiesList.isOverdue).length;
    $('duties-count').textContent = 'Showing ' + shown.length + ' of ' + duties.length + ' duties · ' + overdueCount + ' overdue';
  }

  function change(duty, payload, control, message) {
    ui.busy(control, true);
    window.api.patch('/duties/' + duty.id, payload)
      .then(function () { ui.toast(message); return loadDuties(); })
      .catch(function (err) { ui.busy(control, false); ui.toast(err.message, true); });
  }

  /* ---------------- Create form ---------------- */
  dateInput.addEventListener('change', function () {
    if (!dateInput.value) { forecastBox.textContent = 'Pick a date to see the forecast.'; return; }
    forecastBox.textContent = 'Checking the forecast…';
    forecastBox.className = 'note';
    window.api.get('/duties/forecast?date=' + dateInput.value)
      .then(function (f) {
        forecastBox.textContent = f.description + ', ' + f.tempMin + '–' + f.tempMax + ' °C, ' + f.rainChance + '% chance of rain.'
          + (f.rainExpected ? ' Residents will see this duty as optional.' : '');
        if (f.rainExpected) forecastBox.className = 'note note--warning';
      })
      .catch(function (err) { forecastBox.textContent = err.message; });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    formError.textContent = '';
    var plotMsg = plotSelect.value ? '' : 'Choose a plot.';
    var userMsg = userSelect.value ? '' : 'Choose a resident.';
    var dateMsg = !dateInput.value ? 'Choose a date.' : (dateInput.value < dateInput.min ? 'The date cannot be in the past.' : '');
    ui.fieldError(plotSelect, plotMsg);
    ui.fieldError(userSelect, userMsg);
    ui.fieldError(dateInput, dateMsg);
    if (plotMsg || userMsg || dateMsg) return;

    var button = form.querySelector('button[type="submit"]');
    ui.busy(button, true);
    window.api.post('/duties', { plotId: Number(plotSelect.value), assignedUserId: Number(userSelect.value), dutyDate: dateInput.value })
      .then(function (duty) {
        ui.toast('Duty created: water plot ' + duty.plotLabel + ' on ' + ui.fmtShort.format(ui.parseDay(duty.dutyDate)) + '.');
        form.reset();
        forecastBox.textContent = 'Pick a date to see the forecast.';
        forecastBox.className = 'note';
        return loadDuties();
      })
      .catch(function (err) { formError.textContent = err.message; })
      .finally(function () { ui.busy(button, false); });
  });

  /* ---------------- Load ---------------- */
  function loadDuties() {
    return window.api.get('/duties').then(function (data) { duties = data; render(); });
  }

  Promise.all([window.api.get('/plots?status=assigned'), window.api.get('/users?role=resident')])
    .then(function (r) {
      residents = r[1];
      ui.fillSelect(plotSelect, r[0].map(function (p) { return { value: p.id, text: 'Plot ' + p.label + ' · ' + p.location }; }), true);
      ui.fillSelect(userSelect, residents.map(function (u) { return { value: u.id, text: u.name }; }), true);
      return loadDuties();
    })
    .catch(function (err) {
      ui.clear($('duties-body'));
      $('duties-body').appendChild(ui.emptyRow(6, 'Could not load duties', err.message));
    });

  window.api.get('/duties/forecast')
    .then(window.dutiesList.renderForecast)
    .catch(function () { $('weather-note').textContent = 'Forecast unavailable right now.'; });
})();
