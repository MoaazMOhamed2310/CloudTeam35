// Audit log (owner: Mahmoud)
// GET /api/audit-logs   (admin only)

const logBody = document.querySelector('#log-body');
const logSearch = document.querySelector('#log-search');
const actionSelect = document.querySelector('#log-action');

let allLogs = [];

function showLogs() {
  const search = logSearch.value.trim().toLowerCase();
  const shown = allLogs.filter((log) => {
    const actionMatches = actionSelect.value === '' || log.action === actionSelect.value;
    const textMatches = `${log.userName} ${log.details}`.toLowerCase().includes(search);
    return actionMatches && textMatches;
  });

  logBody.replaceChildren();
  if (shown.length === 0) {
    logBody.append(emptyRow(4, 'No entries found', 'Try another search or action.'));
  }
  shown.forEach((log) => {
    const action = document.createElement('span');
    action.className = log.action === 'login.failed' ? 'badge badge--danger' : 'badge badge--neutral';
    action.textContent = log.action;

    const time = new Date(log.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const row = document.createElement('tr');
    row.append(
      makeCell('Time', time),
      makeCell('User', log.userName),
      makeCell('Action', action),
      makeCell('Details', log.details)
    );
    logBody.append(row);
  });

  document.querySelector('#log-count').textContent = `Showing ${shown.length} of ${allLogs.length} entries`;
}

function fillActions() {
  const actions = [];
  allLogs.forEach((log) => {
    if (!actions.includes(log.action)) actions.push(log.action);
  });
  actions.sort().forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    actionSelect.append(option);
  });
}

async function loadLogs() {
  try {
    allLogs = await apiRequest('/audit-logs');
    fillActions();
    showLogs();
  } catch (error) {
    logBody.replaceChildren(emptyRow(4, 'Could not load the audit log', error.message));
  }
}

logSearch.addEventListener('input', showLogs);
actionSelect.addEventListener('change', showLogs);

if (pageAllowed) {
  loadLogs();
}
