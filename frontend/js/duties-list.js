/* ==========================================================================
   duties-list.js  -  Grouped list of watering duties (owner: Mahmoud)
   Used by resident/dashboard.html (side panel) and resident/duties.html.
   Groups: Overdue, This week, Later, Done.
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;

  function isOverdue(duty) { return duty.status === 'pending' && ui.diffDays(ui.parseDay(duty.dutyDate)) < 0; }

  function dutyRow(duty, onComplete) {
    var date = ui.parseDay(duty.dutyDate);
    var overdue = isOverdue(duty);
    var done = duty.status === 'completed';
    var days = Math.abs(ui.diffDays(date));
    var meta = overdue
      ? days + (days === 1 ? ' day' : ' days') + ' overdue · ' + ui.fmtShort.format(date)
      : ui.relativeDay(date) + ' · ' + ui.fmtShort.format(date);
    if (duty.rainExpected && !done) meta += ' · Rain expected – optional';

    var check = ui.el('button', {
      class: 'check', type: 'button',
      disabled: done,
      'aria-label': done ? 'Duty completed' : 'Mark "Water plot ' + duty.plotLabel + '" on ' + ui.fmtShort.format(date) + ' as completed',
      onClick: function () { onComplete(duty, check); }
    }, ui.icon('check'));

    return ui.el('li', { class: 'row' + (overdue ? ' row--overdue' : '') + (done ? ' row--done' : '') },
      ui.el('span', { class: 'row__icon', 'aria-hidden': 'true' }, ui.icon(duty.rainExpected && !done ? 'rain' : 'drop')),
      ui.el('div', { class: 'row__body' },
        ui.el('p', { class: 'row__title', text: 'Water plot ' + duty.plotLabel }),
        ui.el('p', { class: 'row__meta', text: meta })),
      check);
  }

  /**
   * Draw the grouped list into `root`.
   * options.doneLimit: how many completed duties to show (default 2)
   * Returns the number of open (pending) duties.
   */
  function render(root, duties, onComplete, options) {
    var opts = options || {};
    ui.clear(root);

    var pending = duties.filter(function (d) { return d.status === 'pending'; })
      .sort(function (a, b) { return a.dutyDate.localeCompare(b.dutyDate); });
    var done = duties.filter(function (d) { return d.status === 'completed'; })
      .sort(function (a, b) { return b.dutyDate.localeCompare(a.dutyDate); })
      .slice(0, opts.doneLimit || 2);

    var groups = [
      { title: 'Overdue',   danger: true, items: pending.filter(isOverdue) },
      { title: 'This week', items: pending.filter(function (d) { return !isOverdue(d) && ui.diffDays(ui.parseDay(d.dutyDate)) <= 6; }) },
      { title: 'Later',     items: pending.filter(function (d) { return ui.diffDays(ui.parseDay(d.dutyDate)) > 6; }) },
      { title: 'Done',      items: done }
    ];

    var shown = 0;
    groups.forEach(function (g) {
      if (!g.items.length) return;
      shown += g.items.length;
      root.appendChild(ui.el('p', { class: 'group-label' + (g.danger ? ' group-label--danger' : ''), text: g.title }));
      var list = ui.el('ul', { class: 'rows' });
      g.items.forEach(function (d) { list.appendChild(dutyRow(d, onComplete)); });
      root.appendChild(list);
    });

    if (!shown) root.appendChild(ui.empty('No duties assigned', 'Your watering duties will appear here.'));
    return pending.length;
  }

  /** PATCH /api/duties/:id/complete, then update the object in place */
  function complete(duty, button) {
    ui.busy(button, true);
    return window.api.patch('/duties/' + duty.id + '/complete')
      .then(function (updated) {
        Object.assign(duty, updated);
        ui.toast('Duty marked as completed.');
      })
      .catch(function (err) { ui.toast(err.message, true); ui.busy(button, false); });
  }

  /** Draws the 7-day forecast strip (resident and admin duties pages) */
  function renderForecast(days) {
    var strip = ui.$('forecast-strip');
    ui.clear(strip);
    days.forEach(function (d) {
      var date = ui.parseDay(d.date);
      strip.appendChild(ui.el('div', { class: 'forecast-day', title: d.description },
        ui.el('span', { text: ui.diffDays(date) === 0 ? 'Today' : ui.fmtDay.format(date) }),
        ui.icon(d.rainExpected ? 'rain' : 'sun'),
        ui.el('strong', { text: d.tempMax + '°' }),
        ui.el('span', { text: d.rainChance + '%' })));
    });
    var wet = days.filter(function (d) { return d.rainExpected; }).length;
    ui.$('weather-note').textContent = wet
      ? 'Rain is expected on ' + wet + ' of the next 7 days. Duties on those days are optional.'
      : 'No rain expected this week. Water as planned.';
  }

  window.dutiesList = { render: render, complete: complete, isOverdue: isOverdue, renderForecast: renderForecast };
})();
