// Plan the watering rota (owner: Mahmoud)
// POST  /api/duties                 { plotId, assignedUserId, dutyDate }
// GET   /api/duties
// PATCH /api/duties/:id             { assignedUserId }  or  { status: 'cancelled' }
// GET   /api/duties/forecast?date=
// GET   /api/users?role=resident

const dutyForm = document.querySelector('#duty-form');
const plotSelect = document.querySelector('#duty-plot');
const userSelect = document.querySelector('#duty-user');
const dateInput = document.querySelector('#duty-date');
const forecastBox = document.querySelector('#duty-forecast');
const formMessage = document.querySelector('#duty-form-error');
const dutiesBody = document.querySelector('#duties-body');

let allDuties = [];
let residents = [];
let chosenFilter = 'upcoming';

dateInput.min = todayText();   // no dates in the past

// ---------------- Table ----------------
function matchesFilter(duty) {
  if (chosenFilter === 'upcoming') return duty.status === 'pending' && !isOverdue(duty);
  if (chosenFilter === 'overdue') return isOverdue(duty);
  if (chosenFilter === '') return true;
  return duty.status === chosenFilter;
}

function makeActionsCell(duty) {
  const cell = document.createElement('td');
  cell.className = 'table__actions';
  if (duty.status !== 'pending') return cell;

  // Reassign: choose another resident
  const select = document.createElement('select');
  select.className = 'select select--sm';
  select.setAttribute('aria-label', 'Reassign duty');
  residents.forEach((person) => {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = person.name;
    select.append(option);
  });
  select.value = duty.assignedUserId;
  select.addEventListener('change', () => changeDuty(duty, { assignedUserId: Number(select.value) }, 'Duty reassigned.'));

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn--ghost btn--sm';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', () => changeDuty(duty, { status: 'cancelled' }, 'Duty cancelled.'));

  const box = document.createElement('div');
  box.className = 'assign-cell';
  box.append(select, cancel);
  cell.append(box);
  return cell;
}

function showDuties() {
  const shown = allDuties.filter(matchesFilter);
  dutiesBody.replaceChildren();

  if (shown.length === 0) {
    dutiesBody.append(emptyRow(6, 'No duties here', 'Create a duty with the form above.'));
  }
  shown.forEach((duty) => {
    const date = parseDay(duty.dutyDate);
    let weather = '–';
    if (duty.rainExpected && duty.status === 'pending') {
      weather = document.createElement('span');
      weather.className = 'badge badge--info';
      weather.textContent = 'Rain – optional';
    }

    const row = document.createElement('tr');
    row.append(
      makeCell('Date', `${shortDate.format(date)} (${relativeDay(date)})`),
      makeCell('Plot', duty.plotLabel),
      makeCell('Resident', duty.assigneeName),
      makeCell('Status', makeBadge(isOverdue(duty) ? 'overdue' : duty.status)),
      makeCell('Weather', weather),
      makeActionsCell(duty)
    );
    dutiesBody.append(row);
  });

  const overdue = allDuties.filter(isOverdue).length;
  document.querySelector('#duties-count').textContent = `Showing ${shown.length} of ${allDuties.length} duties · ${overdue} overdue`;
}

async function changeDuty(duty, data, message) {
  try {
    await sendJson(`/duties/${duty.id}`, 'PATCH', data);
    showMessage(message);
    loadDuties();
  } catch (error) {
    showMessage(error.message, true);
  }
}

// ---------------- Create form ----------------
dateInput.addEventListener('change', async () => {
  forecastBox.className = 'note';
  if (!dateInput.value) {
    forecastBox.textContent = 'Pick a date to see the forecast.';
    return;
  }
  try {
    const day = await apiRequest(`/duties/forecast?date=${dateInput.value}`);
    forecastBox.textContent = `${day.description}, ${day.tempMin}–${day.tempMax} °C, ${day.rainChance}% chance of rain.`;
    if (day.rainExpected) {
      forecastBox.textContent += ' Residents will see this duty as optional.';
      forecastBox.className = 'note note--warning';
    }
  } catch (error) {
    forecastBox.textContent = error.message;
  }
});

dutyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!plotSelect.value || !userSelect.value || !dateInput.value) {
    formMessage.textContent = 'Please choose a plot, a resident and a date.';
    return;
  }

  try {
    formMessage.textContent = '';
    const duty = await sendJson('/duties', 'POST', {
      plotId: Number(plotSelect.value),
      assignedUserId: Number(userSelect.value),
      dutyDate: dateInput.value
    });
    showMessage(`Duty created: water plot ${duty.plotLabel} on ${shortDate.format(parseDay(duty.dutyDate))}.`);
    dutyForm.reset();
    forecastBox.textContent = 'Pick a date to see the forecast.';
    forecastBox.className = 'note';
    loadDuties();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

// ---------------- Load ----------------
function addOption(select, value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  select.append(option);
}

async function loadFormChoices() {
  const plots = await apiRequest('/plots?status=assigned');
  residents = await apiRequest('/users?role=resident');
  plots.forEach((plot) => addOption(plotSelect, plot.id, `Plot ${plot.label} · ${plot.location}`));
  residents.forEach((person) => addOption(userSelect, person.id, person.name));
}

async function loadDuties() {
  try {
    allDuties = await apiRequest('/duties');
    showDuties();
  } catch (error) {
    dutiesBody.replaceChildren(emptyRow(6, 'Could not load duties', error.message));
  }
}

async function loadForecast() {
  try {
    const days = await apiRequest('/duties/forecast');
    showForecastStrip(days);
  } catch (error) {
    document.querySelector('#weather-note').textContent = 'Forecast unavailable right now.';
  }
}

document.querySelectorAll('#duty-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#duty-chips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    chip.setAttribute('aria-pressed', 'true');
    chosenFilter = chip.dataset.filter;
    showDuties();
  });
});

if (pageAllowed) {
  loadFormChoices().then(loadDuties).catch((error) => showMessage(error.message, true));
  loadForecast();
}
