// Resident dashboard (owner: Moaaz, integration)
// Uses all three services: applications + plots, loans, duties + forecast.

// ---------------- Header ----------------
function showHeader() {
  document.querySelector('#user-name').textContent = currentUser.name.split(' ')[0];
  document.querySelector('#today').textContent = longDate.format(new Date());
}

// ---------------- My plot + the 3 numbers ----------------
function showPlotAndStats(applications, plots, loans, duties) {
  const approved = applications.find((a) => a.status === 'approved');
  const myPlot = approved ? plots.find((p) => p.id === approved.assignedPlotId) : null;

  if (myPlot) {
    document.querySelector('#plot-label').textContent = myPlot.label;
    document.querySelector('#plot-sub').textContent = `${approved.season} · ${myPlot.size} · ${myPlot.location}`;
    document.querySelector('#stat-plot').textContent = statusText(myPlot.status);
  } else {
    document.querySelector('#plot-label').textContent = 'none yet';
    document.querySelector('#plot-sub').textContent = 'Apply for a plot to get started.';
    document.querySelector('#stat-plot').textContent = 'No plot';
  }

  const onLoan = loans.filter((l) => l.status === 'on_loan').length;
  const dueThisWeek = duties.filter((d) => d.status === 'pending' && daysFromToday(parseDay(d.dutyDate)) <= 6).length;
  document.querySelector('#stat-tools').textContent = onLoan;
  document.querySelector('#stat-duties').textContent = dueThisWeek;
}

// ---------------- Latest 3 applications ----------------
function showApplications(applications) {
  const tableBody = document.querySelector('#apps-body');
  tableBody.replaceChildren();
  const latest = applications.slice(0, 3);

  if (latest.length === 0) {
    tableBody.append(emptyRow(6, 'No applications yet', 'Apply for a plot to see it here.'));
  }

  latest.forEach((app) => {
    const row = document.createElement('tr');
    const actions = document.createElement('td');
    actions.className = 'table__actions';

    if (app.status === 'pending') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn--outline btn--sm';
      button.textContent = 'Withdraw';
      button.setAttribute('aria-label', `Withdraw application for ${app.season}`);
      button.addEventListener('click', () => withdrawApplication(app));
      actions.append(button);
    }

    row.append(
      makeCell('Season', app.season),
      makeCell('Note', app.note || '–'),
      makeCell('Status', makeBadge(app.status)),
      makeCell('Plot', app.plotLabel || '–'),
      makeCell('Submitted', shortDate.format(new Date(app.createdAt))),
      actions
    );
    tableBody.append(row);
  });

  document.querySelector('#apps-count').textContent = `Showing ${latest.length} of ${applications.length} applications`;
}

async function withdrawApplication(app) {
  try {
    await apiRequest(`/applications/${app.id}/withdraw`, { method: 'PATCH' });
    showMessage('Application withdrawn.');
    loadDashboard();
  } catch (error) {
    showMessage(error.message, true);
  }
}

// ---------------- Tools I've borrowed ----------------
function showLoans(loans) {
  const list = document.querySelector('#loans-list');
  list.replaceChildren();
  const onLoan = loans.filter((l) => l.status === 'on_loan');

  if (onLoan.length === 0) {
    list.append(emptyMessage('Nothing borrowed', 'Tools you check out will show up here.'));
    return;
  }

  onLoan.forEach((loan) => {
    const row = document.createElement('li');
    row.className = 'row';

    const icon = document.createElement('span');
    icon.className = 'row__icon';
    icon.append(createIcon('tool'));

    const body = document.createElement('div');
    body.className = 'row__body';
    const title = document.createElement('p');
    title.className = 'row__title';
    title.textContent = loan.toolName;
    const meta = document.createElement('p');
    meta.className = 'row__meta';
    meta.textContent = `Borrowed ${relativeDay(new Date(loan.checkoutDate)).toLowerCase()} · ${loan.category}`;
    body.append(title, meta);

    const link = document.createElement('a');
    link.className = 'btn btn--outline btn--sm';
    link.href = 'loans.html';
    link.textContent = 'Return';

    row.append(icon, body, link);
    list.append(row);
  });
}

// ---------------- Plots at a glance ----------------
function showPlotsGlance(plots) {
  const counts = {
    available: plots.filter((p) => p.status === 'available').length,
    assigned: plots.filter((p) => p.status === 'assigned').length,
    maintenance: plots.filter((p) => p.status === 'maintenance').length
  };

  const bar = document.querySelector('#plots-bar');
  bar.children[0].style.width = `${(counts.available / plots.length) * 100}%`;
  bar.children[1].style.width = `${(counts.assigned / plots.length) * 100}%`;
  bar.children[2].style.width = `${(counts.maintenance / plots.length) * 100}%`;

  const legend = document.querySelector('#plots-legend');
  legend.replaceChildren();
  Object.keys(counts).forEach((status) => {
    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = `legend__dot segbar__${status}`;
    const count = document.createElement('span');
    count.className = 'legend__count';
    count.textContent = counts[status];
    item.append(dot, statusText(status), count);
    legend.append(item);
  });
}

// ---------------- Watering duties + weather ----------------
function showDuties(duties) {
  const open = showDutyGroups(document.querySelector('#duties-groups'), duties, async (duty) => {
    try {
      await completeDuty(duty);
      loadDashboard();
    } catch (error) {
      showMessage(error.message, true);
    }
  });
  document.querySelector('#duties-open').textContent = `${open} open`;
}

function showWeather(today) {
  if (!today) {
    document.querySelector('#weather-desc').textContent = 'Forecast unavailable';
    document.querySelector('#weather-note').textContent = 'Could not reach the weather service. Water as planned.';
    return;
  }
  document.querySelector('#weather-date').textContent = shortDate.format(parseDay(today.date));
  document.querySelector('#weather-temp').textContent = `${today.tempMin} – ${today.tempMax} °C`;
  document.querySelector('#weather-desc').textContent = `${today.description} · ${today.rainChance}% chance of rain`;
  document.querySelector('#weather-note').textContent = today.rainExpected
    ? 'Rain is expected, so today’s watering is optional. You can skip it.'
    : 'Dry weather expected. Watering duties are on as planned.';
  document.querySelector('#weather-icon use').setAttribute('href', today.rainExpected ? '#i-rain' : '#i-sun');
}

// ---------------- Load everything ----------------
async function loadDashboard() {
  try {
    const applications = await apiRequest('/applications');
    const plots = await apiRequest('/plots');
    const loans = await apiRequest('/loans');
    const duties = await apiRequest('/duties');

    showHeader();
    showPlotAndStats(applications, plots, loans, duties);
    showApplications(applications);
    showLoans(loans);
    showPlotsGlance(plots);
    showDuties(duties);
  } catch (error) {
    console.error(error);
    showMessage(`Could not load your dashboard: ${error.message}`, true);
  }

  // The weather is extra: if it fails, the rest of the page still works
  try {
    const today = await apiRequest(`/duties/forecast?date=${todayText()}`);
    showWeather(today);
  } catch (error) {
    showWeather(null);
  }
}

if (pageAllowed) {
  loadDashboard();
}
