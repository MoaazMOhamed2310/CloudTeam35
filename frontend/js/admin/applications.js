// Review applications and assign plots (owner: Moaaz)
// GET   /api/applications
// GET   /api/plots?status=available
// PATCH /api/applications/:id/assign   { plotId }
// PATCH /api/applications/:id/reject

const appsBody = document.querySelector('#apps-body');
const seasonFilter = document.querySelector('#season-filter');

let allApplications = [];
let freePlots = [];
let chosenStatus = 'pending';

function makeDecisionCell(app) {
  const cell = document.createElement('td');
  cell.className = 'table__actions';

  if (app.status !== 'pending') {
    cell.textContent = app.plotLabel ? `Plot ${app.plotLabel}` : '–';
    return cell;
  }

  const select = document.createElement('select');
  select.className = 'select select--sm';
  select.setAttribute('aria-label', `Plot for ${app.userName}`);
  const first = document.createElement('option');
  first.value = '';
  first.textContent = freePlots.length > 0 ? 'Choose plot' : 'No free plots';
  select.append(first);
  freePlots.forEach((plot) => {
    const option = document.createElement('option');
    option.value = plot.id;
    option.textContent = `${plot.label} · ${plot.size}`;
    select.append(option);
  });

  const approve = document.createElement('button');
  approve.type = 'button';
  approve.className = 'btn btn--primary btn--sm';
  approve.textContent = 'Approve';
  approve.addEventListener('click', () => approveApplication(app, select.value));

  const reject = document.createElement('button');
  reject.type = 'button';
  reject.className = 'btn btn--outline btn--sm';
  reject.textContent = 'Reject';
  reject.setAttribute('aria-label', `Reject application from ${app.userName}`);
  reject.addEventListener('click', () => rejectApplication(app));

  const box = document.createElement('div');
  box.className = 'assign-cell';
  box.append(select, approve, reject);
  cell.append(box);
  return cell;
}

function showApplications() {
  const shown = allApplications.filter((app) => {
    const statusMatches = chosenStatus === '' || app.status === chosenStatus;
    const seasonMatches = seasonFilter.value === '' || app.season === seasonFilter.value;
    return statusMatches && seasonMatches;
  });

  appsBody.replaceChildren();
  if (shown.length === 0) {
    appsBody.append(emptyRow(6, 'No applications here', 'Try another filter.'));
  }
  shown.forEach((app) => {
    const row = document.createElement('tr');
    row.append(
      makeCell('Resident', app.userName),
      makeCell('Season', app.season),
      makeCell('Note', app.note || '–'),
      makeCell('Status', makeBadge(app.status)),
      makeCell('Submitted', shortDate.format(new Date(app.createdAt))),
      makeDecisionCell(app)
    );
    appsBody.append(row);
  });

  document.querySelector('#apps-count').textContent = `Showing ${shown.length} of ${allApplications.length} applications`;
  document.querySelector('#free-count').textContent = `${freePlots.length} plots free`;
}

function fillSeasons() {
  const seasons = [];
  allApplications.forEach((app) => {
    if (!seasons.includes(app.season)) seasons.push(app.season);
  });
  const chosen = seasonFilter.value;
  seasonFilter.replaceChildren();
  const all = document.createElement('option');
  all.value = '';
  all.textContent = 'All seasons';
  seasonFilter.append(all);
  seasons.forEach((season) => {
    const option = document.createElement('option');
    option.value = season;
    option.textContent = season;
    seasonFilter.append(option);
  });
  seasonFilter.value = chosen;
}

async function approveApplication(app, plotId) {
  if (plotId === '') {
    showMessage('Choose a plot first.', true);
    return;
  }
  try {
    const updated = await sendJson(`/applications/${app.id}/assign`, 'PATCH', { plotId: Number(plotId) });
    showMessage(`Approved. Plot ${updated.plotLabel} assigned to ${app.userName}.`);
    loadApplications();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function rejectApplication(app) {
  try {
    await apiRequest(`/applications/${app.id}/reject`, { method: 'PATCH' });
    showMessage('Application rejected.');
    loadApplications();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadApplications() {
  try {
    allApplications = await apiRequest('/applications');
    freePlots = await apiRequest('/plots?status=available');
    fillSeasons();
    showApplications();
  } catch (error) {
    appsBody.replaceChildren(emptyRow(6, 'Could not load applications', error.message));
  }
}

document.querySelectorAll('#app-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#app-chips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    chip.setAttribute('aria-pressed', 'true');
    chosenStatus = chip.dataset.status;
    showApplications();
  });
});

seasonFilter.addEventListener('change', showApplications);

if (pageAllowed) {
  loadApplications();
}
