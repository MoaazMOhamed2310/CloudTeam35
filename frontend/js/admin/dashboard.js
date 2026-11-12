// Committee dashboard (owner: Moaaz, integration)

function makeRow(iconName, titleText, metaText, extra) {
  const row = document.createElement('li');
  row.className = 'row';
  const icon = document.createElement('span');
  icon.className = 'row__icon';
  icon.append(createIcon(iconName));
  const body = document.createElement('div');
  body.className = 'row__body';
  const title = document.createElement('p');
  title.className = 'row__title';
  title.textContent = titleText;
  const meta = document.createElement('p');
  meta.className = 'row__meta';
  meta.textContent = metaText;
  body.append(title, meta);
  row.append(icon, body);
  if (extra) row.append(extra);
  return row;
}

function showNumbers(applications, plots, loans, duties) {
  document.querySelector('#kpi-pending').textContent = applications.filter((a) => a.status === 'pending').length;
  document.querySelector('#kpi-available').textContent = plots.filter((p) => p.status === 'available').length;
  document.querySelector('#kpi-loans').textContent = loans.filter((l) => l.status === 'on_loan').length;
  document.querySelector('#kpi-overdue').textContent = duties.filter((d) => d.status === 'pending' && daysFromToday(parseDay(d.dutyDate)) < 0).length;
}

function showWaiting(applications) {
  const list = document.querySelector('#waiting-list');
  list.replaceChildren();
  const pending = applications.filter((a) => a.status === 'pending').slice(0, 4);

  if (pending.length === 0) {
    list.append(emptyMessage('All caught up', 'No applications are waiting.'));
  }
  pending.forEach((app) => {
    const link = document.createElement('a');
    link.className = 'btn btn--outline btn--sm';
    link.href = 'applications.html';
    link.textContent = 'Review';
    list.append(makeRow('user', `${app.userName} · ${app.season}`, app.note || 'No note', link));
  });
}

function showPlotsGlance(plots) {
  const statuses = ['available', 'assigned', 'maintenance'];
  const bar = document.querySelector('#plots-bar');
  const legend = document.querySelector('#plots-legend');
  legend.replaceChildren();

  statuses.forEach((status, i) => {
    const count = plots.filter((p) => p.status === status).length;
    bar.children[i].style.width = `${(count / plots.length) * 100}%`;

    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = `legend__dot segbar__${status}`;
    const number = document.createElement('span');
    number.className = 'legend__count';
    number.textContent = count;
    item.append(dot, statusText(status), number);
    legend.append(item);
  });
}

function showActivity(logs) {
  const list = document.querySelector('#activity-list');
  list.replaceChildren();
  logs.slice(0, 6).forEach((log) => {
    const time = new Date(log.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const row = makeRow(log.action === 'login.failed' ? 'alert' : 'shield', log.details, `${log.userName} · ${time}`);
    if (log.action === 'login.failed') row.classList.add('row--overdue');
    list.append(row);
  });
}

async function loadAdminDashboard() {
  document.querySelector('#today').textContent = longDate.format(new Date());
  try {
    const applications = await apiRequest('/applications');
    const plots = await apiRequest('/plots');
    const loans = await apiRequest('/loans');
    const duties = await apiRequest('/duties');
    const logs = await apiRequest('/audit-logs');

    showNumbers(applications, plots, loans, duties);
    showWaiting(applications);
    showPlotsGlance(plots);
    showActivity(logs);
  } catch (error) {
    console.error(error);
    showMessage(`Could not load the dashboard: ${error.message}`, true);
  }
}

if (pageAllowed) {
  loadAdminDashboard();
}
