// Tool inventory (owner: Mayan)
// GET   /api/tools
// GET   /api/loans                 to show who borrowed each tool
// POST  /api/tools                 { name, category, condition }
// PATCH /api/tools/:id             { name, category, condition }

const toolForm = document.querySelector('#tool-form');
const toolIdInput = document.querySelector('#tool-id');
const nameInput = document.querySelector('#tool-name');
const categoryInput = document.querySelector('#tool-category-input');
const conditionInput = document.querySelector('#tool-condition');
const submitButton = document.querySelector('#tool-submit');
const cancelButton = document.querySelector('#tool-cancel');
const formMessage = document.querySelector('#tool-form-error');
const toolsBody = document.querySelector('#tools-body');
const toolSearch = document.querySelector('#tool-search');

let allTools = [];
let allLoans = [];

function borrowerOf(tool) {
  const loan = allLoans.find((l) => l.toolId === tool.id && l.status === 'on_loan');
  return loan ? loan.userName : '–';
}

function showTools() {
  const search = toolSearch.value.trim().toLowerCase();
  const shown = allTools.filter((tool) => `${tool.name} ${tool.category}`.toLowerCase().includes(search));

  toolsBody.replaceChildren();
  if (shown.length === 0) {
    toolsBody.append(emptyRow(5, 'No tools found', 'Try another search.'));
  }
  shown.forEach((tool) => {
    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Tool';
    const name = document.createElement('span');
    name.className = 'table__strong';
    name.textContent = tool.name;
    const category = document.createElement('span');
    category.className = 'table__sub';
    category.textContent = tool.category;
    nameCell.append(name, category);

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn btn--outline btn--sm';
    editButton.textContent = 'Edit';
    editButton.setAttribute('aria-label', `Edit ${tool.name}`);
    editButton.addEventListener('click', () => startEditing(tool));
    const actions = document.createElement('td');
    actions.className = 'table__actions';
    actions.append(editButton);

    const row = document.createElement('tr');
    row.append(
      nameCell,
      makeCell('Condition', makeBadge(tool.condition)),
      makeCell('Status', makeBadge(tool.status)),
      makeCell('Borrowed by', borrowerOf(tool)),
      actions
    );
    toolsBody.append(row);
  });

  const onLoan = allTools.filter((t) => t.status === 'on_loan').length;
  document.querySelector('#tools-count').textContent = `${allTools.length} tools · ${onLoan} on loan`;
}

// ---------------- Add / edit form ----------------
function startEditing(tool) {
  toolIdInput.value = tool.id;
  nameInput.value = tool.name;
  categoryInput.value = tool.category;
  conditionInput.value = tool.condition;
  document.querySelector('#form-title').textContent = `Edit ${tool.name}`;
  submitButton.textContent = 'Save changes';
  cancelButton.hidden = false;
}

function stopEditing() {
  toolForm.reset();
  toolIdInput.value = '';
  document.querySelector('#form-title').textContent = 'Add a tool';
  submitButton.textContent = 'Add tool';
  cancelButton.hidden = true;
  formMessage.textContent = '';
}

cancelButton.addEventListener('click', stopEditing);

toolForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = {
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    condition: conditionInput.value
  };

  if (!data.name || !data.category) {
    formMessage.textContent = 'Please enter the tool name and category.';
    return;
  }

  try {
    if (toolIdInput.value) {
      await sendJson(`/tools/${toolIdInput.value}`, 'PATCH', data);
      showMessage(`${data.name} updated.`);
    } else {
      await sendJson('/tools', 'POST', data);
      showMessage(`${data.name} added to the inventory.`);
    }
    stopEditing();
    loadTools();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

async function loadTools() {
  try {
    allTools = await apiRequest('/tools');
    allLoans = await apiRequest('/loans');
    showTools();
  } catch (error) {
    toolsBody.replaceChildren(emptyRow(5, 'Could not load tools', error.message));
  }
}

toolSearch.addEventListener('input', showTools);

if (pageAllowed) {
  loadTools();
}
