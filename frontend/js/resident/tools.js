/* ==========================================================================
   resident/tools.js  -  Browse and borrow tools (owner: Mayan)
   Functions:
     GET  /api/tools?search=&category=   list and search tools with availability
     POST /api/tools/:id/checkout        borrow a tool -> 201 loan, 409 if not available
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var tools = [];

  var search = $('tool-search');
  var category = $('tool-category');
  var onlyAvailable = $('only-available');
  [search, category, onlyAvailable].forEach(function (input) {
    input.addEventListener(input === search ? 'input' : 'change', render);
  });

  function toolTile(tool) {
    var borrow = el('button', {
      class: 'btn btn--primary btn--sm', type: 'button',
      disabled: !tool.available,
      'aria-label': 'Borrow ' + tool.name,
      onClick: function () { checkout(tool, borrow); }
    }, tool.available ? 'Borrow' : 'Unavailable');

    return el('article', { class: 'tile tool-tile tool-tile--' + tool.status },
      el('div', { class: 'tile__head' },
        el('span', { class: 'row__icon', 'aria-hidden': 'true' }, ui.icon('tool')),
        el('div', {},
          el('h3', { class: 'tile__title', text: tool.name }),
          el('p', { class: 'row__meta', text: tool.category }))),
      el('div', { class: 'tile__meta' }, el('span', { text: 'Condition: ' + ui.label(tool.condition) })),
      el('div', { class: 'tile__foot' }, ui.badge(tool.status), borrow));
  }

  function render() {
    var grid = $('tools-grid');
    var term = search.value.trim().toLowerCase();
    var shown = tools.filter(function (t) {
      return (!term || t.name.toLowerCase().indexOf(term) !== -1)
        && (!category.value || t.category === category.value)
        && (!onlyAvailable.checked || t.available);
    });

    ui.clear(grid);
    if (!shown.length) grid.appendChild(ui.empty('No tools found', 'Try another search or category.'));
    shown.forEach(function (t) { grid.appendChild(toolTile(t)); });

    var free = tools.filter(function (t) { return t.available; }).length;
    $('tools-count').textContent = 'Showing ' + shown.length + ' of ' + tools.length + ' tools · ' + free + ' available now';
  }

  function checkout(tool, button) {
    ui.busy(button, true);
    window.api.post('/tools/' + tool.id + '/checkout')
      .then(function () {
        ui.toast(tool.name + ' borrowed. Find it under My loans.');
        return load();
      })
      .catch(function (err) { ui.busy(button, false); ui.toast(err.message, true); });
  }

  function load() {
    return window.api.get('/tools').then(function (data) {
      tools = data;
      var categories = tools.map(function (t) { return t.category; })
        .filter(function (c, i, all) { return all.indexOf(c) === i; }).sort();
      var chosen = category.value;
      ui.fillSelect(category, categories.map(function (c) { return { value: c, text: c }; }), true);
      category.value = chosen;
      render();
    });
  }

  load().catch(function (err) {
    ui.clear($('tools-grid'));
    $('tools-grid').appendChild(ui.empty('Could not load tools', err.message));
  });
})();
