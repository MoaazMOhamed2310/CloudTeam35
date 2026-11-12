// Browse and borrow tools (owner: Mayan)
// GET  /api/tools
// POST /api/tools/:id/checkout

const toolsGrid = document.querySelector('#tools-grid');
const toolSearch = document.querySelector('#tool-search');
const categorySelect = document.querySelector('#tool-category');
const onlyAvailable = document.querySelector('#only-available');

let allTools = [];

function makeToolCard(tool) {
  const card = document.createElement('article');
  card.className = `tile tool-tile tool-tile--${tool.status}`;

  const head = document.createElement('div');
  head.className = 'tile__head';
  const icon = document.createElement('span');
  icon.className = 'row__icon';
  icon.append(createIcon('tool'));
  const titles = document.createElement('div');
  const title = document.createElement('h3');
  title.className = 'tile__title';
  title.textContent = tool.name;
  const category = document.createElement('p');
  category.className = 'row__meta';
  category.textContent = tool.category;
  titles.append(title, category);
  head.append(icon, titles);

  const condition = document.createElement('p');
  condition.className = 'tile__meta';
  condition.textContent = `Condition: ${statusText(tool.condition)}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn--primary btn--sm';
  button.disabled = tool.status !== 'available';
  button.textContent = tool.status === 'available' ? 'Borrow' : 'Unavailable';
  button.setAttribute('aria-label', `Borrow ${tool.name}`);
  button.addEventListener('click', () => borrowTool(tool));

  const foot = document.createElement('div');
  foot.className = 'tile__foot';
  foot.append(makeBadge(tool.status), button);

  card.append(head, condition, foot);
  return card;
}

function showTools() {
  const search = toolSearch.value.trim().toLowerCase();

  const shown = allTools.filter((tool) => {
    const textMatches = tool.name.toLowerCase().includes(search);
    const categoryMatches = categorySelect.value === '' || tool.category === categorySelect.value;
    const availableMatches = !onlyAvailable.checked || tool.status === 'available';
    return textMatches && categoryMatches && availableMatches;
  });

  toolsGrid.replaceChildren();
  if (shown.length === 0) {
    toolsGrid.append(emptyMessage('No tools found', 'Try another search or category.'));
  }
  shown.forEach((tool) => toolsGrid.append(makeToolCard(tool)));

  const free = allTools.filter((t) => t.status === 'available').length;
  document.querySelector('#tools-count').textContent = `Showing ${shown.length} of ${allTools.length} tools · ${free} available now`;
}

// Put each category once in the drop-down
function fillCategories() {
  const categories = [];
  allTools.forEach((tool) => {
    if (!categories.includes(tool.category)) categories.push(tool.category);
  });
  categories.sort().forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    categorySelect.append(option);
  });
}

async function borrowTool(tool) {
  try {
    await apiRequest(`/tools/${tool.id}/checkout`, { method: 'POST' });
    showMessage(`${tool.name} borrowed. Find it under My loans.`);
    allTools = await apiRequest('/tools');
    showTools();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadTools() {
  try {
    allTools = await apiRequest('/tools');
    fillCategories();
    showTools();
  } catch (error) {
    toolsGrid.replaceChildren(emptyMessage('Could not load tools', error.message));
  }
}

toolSearch.addEventListener('input', showTools);
categorySelect.addEventListener('change', showTools);
onlyAvailable.addEventListener('change', showTools);

if (pageAllowed) {
  loadTools();
}
