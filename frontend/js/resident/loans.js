/* ==========================================================================
   resident/loans.js  -  My loans: return and report damage (owner: Mayan)
   Functions:
     GET   /api/loans                 own loans (resident)
     PATCH /api/loans/:id/return      { condition: good|fair|damaged }
     POST  /api/tools/:id/report      { note }  report a damaged tool
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var loans = [];

  function activeRow(loan) {
    var selectId = 'condition-' + loan.id;
    var condition = el('select', { class: 'select select--sm', id: selectId },
      el('option', { value: 'good', text: 'Good' }),
      el('option', { value: 'fair', text: 'Fair' }),
      el('option', { value: 'damaged', text: 'Damaged' }));

    var returnBtn = el('button', {
      class: 'btn btn--primary btn--sm', type: 'button',
      onClick: function () { returnTool(loan, condition.value, returnBtn); }
    }, 'Return');

    var reportBtn = el('button', {
      class: 'btn btn--ghost btn--sm', type: 'button',
      'aria-label': 'Report ' + loan.toolName + ' as damaged',
      onClick: function () { report(loan, reportBtn); }
    }, ui.icon('alert'), 'Report damage');

    var days = Math.abs(ui.diffDays(new Date(loan.checkoutDate)));
    return el('li', { class: 'row' },
      el('span', { class: 'row__icon', 'aria-hidden': 'true' }, ui.icon('tool')),
      el('div', { class: 'row__body' },
        el('p', { class: 'row__title', text: loan.toolName }),
        el('p', { class: 'row__meta', text: 'Borrowed ' + ui.relativeDay(new Date(loan.checkoutDate)).toLowerCase() + ' · ' + loan.category + (days >= 7 ? ' · Please return soon' : '') })),
      el('div', { class: 'loan-actions' },
        el('label', { class: 'visually-hidden', for: selectId, text: 'Condition of ' + loan.toolName }),
        condition, returnBtn, reportBtn));
  }

  function render() {
    var active = loans.filter(function (l) { return l.status === 'on_loan'; });
    var history = loans.filter(function (l) { return l.status === 'returned'; });

    var list = $('active-list');
    ui.clear(list);
    if (!active.length) list.appendChild(el('li', {}, ui.empty('Nothing borrowed', 'Tools you borrow will show up here.')));
    active.forEach(function (l) { list.appendChild(activeRow(l)); });
    $('active-count').textContent = active.length + ' on loan';

    var body = $('history-body');
    ui.clear(body);
    if (!history.length) body.appendChild(ui.emptyRow(5, 'No returned tools yet', ''));
    history.forEach(function (l) {
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Tool', class: 'table__strong', text: l.toolName }),
        el('td', { 'data-label': 'Category', text: l.category }),
        el('td', { 'data-label': 'Borrowed', text: ui.fmtShort.format(new Date(l.checkoutDate)) }),
        el('td', { 'data-label': 'Returned', text: ui.fmtShort.format(new Date(l.returnDate)) }),
        el('td', { 'data-label': 'Condition' }, ui.badge(l.returnCondition))));
    });
  }

  function returnTool(loan, condition, button) {
    ui.busy(button, true);
    window.api.patch('/loans/' + loan.id + '/return', { condition: condition })
      .then(function () {
        ui.toast(loan.toolName + ' returned. Thank you!');
        return load();
      })
      .catch(function (err) { ui.busy(button, false); ui.toast(err.message, true); });
  }

  function report(loan, button) {
    ui.busy(button, true);
    window.api.post('/tools/' + loan.toolId + '/report', { note: 'Reported by borrower' })
      .then(function () { ui.toast('Thanks, the committee has been told ' + loan.toolName + ' is damaged.'); })
      .catch(function (err) { ui.toast(err.message, true); })
      .finally(function () { ui.busy(button, false); });
  }

  function load() {
    return window.api.get('/loans').then(function (data) { loans = data; render(); });
  }

  load().catch(function (err) {
    ui.clear($('active-list'));
    $('active-list').appendChild(el('li', {}, ui.empty('Could not load your loans', err.message)));
  });
})();
