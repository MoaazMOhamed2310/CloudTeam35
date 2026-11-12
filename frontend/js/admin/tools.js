/* ==========================================================================
   admin/tools.js  -  Tool inventory (owner: Mayan)
   Functions:
     GET   /api/tools          inventory with availability
     POST  /api/tools          { name, category, condition }  add a tool (admin)
     PATCH /api/tools/:id      { name, category, condition }  edit a tool (admin)
     GET   /api/loans          all loans, to show who has each tool (admin)
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var tools = [];
  var borrowers = {};   // toolId -> resident name

  var form = $('tool-form');
  var idInput = $('tool-id');
  var nameInput = $('tool-name');
  var categoryInput = $('tool-category-input');
  var conditionInput = $('tool-condition');
  var submit = $('tool-submit');
  var cancel = $('tool-cancel');
  var formError = $('tool-form-error');

  $('tool-search').addEventListener('input', render);

  /* ---------------- Table ---------------- */
  function render() {
    var body = $('tools-body');
    var term = $('tool-search').value.trim().toLowerCase();
    var shown = tools.filter(function (t) { return !term || (t.name + ' ' + t.category).toLowerCase().indexOf(term) !== -1; });

    ui.clear(body);
    if (!shown.length) body.appendChild(ui.emptyRow(5, 'No tools found', 'Try another search.'));
    shown.forEach(function (t) {
      body.appendChild(el('tr', {},
        el('td', { 'data-label': 'Tool' },
          el('span', { class: 'table__strong', text: t.name }),
          el('span', { class: 'table__sub', text: t.category })),
        el('td', { 'data-label': 'Condition' }, ui.badge(t.condition)),
        el('td', { 'data-label': 'Status' }, ui.badge(t.status)),
        el('td', { 'data-label': 'Borrowed by', text: borrowers[t.id] || '–' }),
        el('td', { class: 'table__actions' },
          el('button', {
            class: 'btn btn--outline btn--sm', type: 'button',
            'aria-label': 'Edit ' + t.name,
            onClick: function () { startEdit(t); }
          }, ui.icon('edit'), 'Edit'))));
    });

    var out = tools.filter(function (t) { return t.status === 'on_loan'; }).length;
    var damaged = tools.filter(function (t) { return t.status === 'damaged'; }).length;
    $('tools-count').textContent = tools.length + ' tools · ' + out + ' on loan · ' + damaged + ' damaged';

    var categories = tools.map(function (t) { return t.category; }).filter(function (c, i, all) { return all.indexOf(c) === i; });
    ui.fillSelect($('category-list'), categories.map(function (c) { return { value: c, text: c }; }), false);
  }

  /* ---------------- Add / edit form ---------------- */
  function startEdit(tool) {
    idInput.value = tool.id;
    nameInput.value = tool.name;
    categoryInput.value = tool.category;
    conditionInput.value = tool.condition;
    $('form-title').textContent = 'Edit ' + tool.name;
    submit.textContent = 'Save changes';
    cancel.hidden = false;
    nameInput.focus();
  }

  function resetForm() {
    form.reset();
    idInput.value = '';
    $('form-title').textContent = 'Add a tool';
    submit.textContent = 'Add tool';
    cancel.hidden = true;
    formError.textContent = '';
    ui.fieldError(nameInput, '');
    ui.fieldError(categoryInput, '');
  }

  cancel.addEventListener('click', resetForm);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    formError.textContent = '';
    var nameMsg = nameInput.value.trim() ? '' : 'Enter the tool name.';
    var catMsg = categoryInput.value.trim() ? '' : 'Enter a category.';
    ui.fieldError(nameInput, nameMsg);
    ui.fieldError(categoryInput, catMsg);
    if (nameMsg || catMsg) return;

    var payload = { name: nameInput.value.trim(), category: categoryInput.value.trim(), condition: conditionInput.value };
    var editing = Boolean(idInput.value);
    var request = editing ? window.api.patch('/tools/' + idInput.value, payload) : window.api.post('/tools', payload);

    ui.busy(submit, true);
    request
      .then(function (tool) {
        ui.toast(editing ? tool.name + ' updated.' : tool.name + ' added to the inventory.');
        resetForm();
        return load();
      })
      .catch(function (err) { formError.textContent = err.message; })
      .finally(function () { ui.busy(submit, false); });
  });

  function load() {
    return Promise.all([window.api.get('/tools'), window.api.get('/loans')]).then(function (r) {
      tools = r[0];
      borrowers = {};
      r[1].filter(function (l) { return l.status === 'on_loan'; }).forEach(function (l) { borrowers[l.toolId] = l.userName; });
      render();
    });
  }

  load().catch(function (err) {
    ui.clear($('tools-body'));
    $('tools-body').appendChild(ui.emptyRow(5, 'Could not load tools', err.message));
  });
})();
