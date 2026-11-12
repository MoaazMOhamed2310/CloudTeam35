// Browse plots (owner: Moaaz)
// GET /api/plots

const plotsGrid = document.querySelector('#plots-grid');
const plotSearch = document.querySelector('#plot-search');
const plotsCount = document.querySelector('#plots-count');

let allPlots = [];
let chosenStatus = '';

function makePlotCard(plot) {
  const card = document.createElement('article');
  card.className = `tile plot-tile plot-tile--${plot.status}`;

  const head = document.createElement('div');
  head.className = 'tile__head';
  const icon = document.createElement('span');
  icon.className = 'row__icon';
  icon.append(createIcon(plot.status === 'maintenance' ? 'tool' : 'sprout'));
  const titles = document.createElement('div');
  const title = document.createElement('h3');
  title.className = 'tile__title';
  title.textContent = `Plot ${plot.label}`;
  const location = document.createElement('p');
  location.className = 'row__meta';
  location.textContent = plot.location;
  titles.append(title, location);
  head.append(icon, titles);

  const size = document.createElement('p');
  size.className = 'tile__meta';
  size.textContent = `Size: ${plot.size}`;

  const foot = document.createElement('div');
  foot.className = 'tile__foot';
  foot.append(makeBadge(plot.status));
  if (plot.status === 'available') {
    const apply = document.createElement('a');
    apply.className = 'btn btn--outline btn--sm';
    apply.href = 'applications.html#new';
    apply.textContent = 'Apply';
    foot.append(apply);
  }

  card.append(head, size, foot);
  return card;
}

function showPlots() {
  const search = plotSearch.value.trim().toLowerCase();

  const shown = allPlots.filter((plot) => {
    const statusMatches = chosenStatus === '' || plot.status === chosenStatus;
    const textMatches = `${plot.label} ${plot.location}`.toLowerCase().includes(search);
    return statusMatches && textMatches;
  });

  plotsGrid.replaceChildren();
  if (shown.length === 0) {
    plotsGrid.append(emptyMessage('No plots found', 'Try another filter or search.'));
  }
  shown.forEach((plot) => plotsGrid.append(makePlotCard(plot)));

  const free = allPlots.filter((p) => p.status === 'available').length;
  plotsCount.textContent = `Showing ${shown.length} of ${allPlots.length} plots · ${free} available`;
}

async function loadPlots() {
  try {
    allPlots = await apiRequest('/plots');
    showPlots();
  } catch (error) {
    plotsGrid.replaceChildren(emptyMessage('Could not load plots', error.message));
  }
}

// Filter buttons: All / Available / Assigned / Maintenance
document.querySelectorAll('#status-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#status-chips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    chip.setAttribute('aria-pressed', 'true');
    chosenStatus = chip.dataset.status;
    showPlots();
  });
});

plotSearch.addEventListener('input', showPlots);

if (pageAllowed) {
  loadPlots();
}
