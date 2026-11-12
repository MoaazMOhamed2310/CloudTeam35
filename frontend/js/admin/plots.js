// Manage plots (owner: Moaaz)
// GET   /api/plots
// PATCH /api/plots/:id/status   { status }

const plotsBody = document.querySelector('#plots-body');
const plotSearch = document.querySelector('#plot-search');

let allPlots = [];
let applications = [];
let chosenStatus = '';

// Who has this plot? (from approved applications)
function plotHolder(plot) {
  const approved = applications.find((a) => a.status === 'approved' && a.assignedPlotId === plot.id);
  return approved ? approved.userName : '–';
}

function makeStatusSelect(plot) {
  const select = document.createElement('select');
  select.className = 'select select--sm';
  select.setAttribute('aria-label', `Status of plot ${plot.label}`);
  ['available', 'assigned', 'maintenance'].forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = statusText(status);
    select.append(option);
  });
  select.value = plot.status;
  select.addEventListener('change', () => changeStatus(plot, select.value));
  return select;
}

function showPlots() {
  const search = plotSearch.value.trim().toLowerCase();
  const shown = allPlots.filter((plot) => {
    const statusMatches = chosenStatus === '' || plot.status === chosenStatus;
    const textMatches = `${plot.label} ${plot.location}`.toLowerCase().includes(search);
    return statusMatches && textMatches;
  });

  plotsBody.replaceChildren();
  if (shown.length === 0) {
    plotsBody.append(emptyRow(6, 'No plots found', 'Try another filter.'));
  }
  shown.forEach((plot) => {
    const row = document.createElement('tr');
    row.append(
      makeCell('Plot', plot.label),
      makeCell('Size', plot.size),
      makeCell('Location', plot.location),
      makeCell('Assigned to', plotHolder(plot)),
      makeCell('Status', makeBadge(plot.status)),
      makeCell('Change status', makeStatusSelect(plot))
    );
    plotsBody.append(row);
  });
  document.querySelector('#plots-count').textContent = `Showing ${shown.length} of ${allPlots.length} plots`;
}

async function changeStatus(plot, newStatus) {
  try {
    await sendJson(`/plots/${plot.id}/status`, 'PATCH', { status: newStatus });
    showMessage(`Plot ${plot.label} is now ${statusText(newStatus).toLowerCase()}.`);
    loadPlots();
  } catch (error) {
    showMessage(error.message, true);
    showPlots();
  }
}

async function loadPlots() {
  try {
    allPlots = await apiRequest('/plots');
    applications = await apiRequest('/applications');
    showPlots();
  } catch (error) {
    plotsBody.replaceChildren(emptyRow(6, 'Could not load plots', error.message));
  }
}

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
