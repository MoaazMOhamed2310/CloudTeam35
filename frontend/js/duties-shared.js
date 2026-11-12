// Watering duties list and the 7-day forecast (owner: Mahmoud)
// Used by resident/dashboard.html, resident/duties.html and admin/duties.html

function isOverdue(duty) {
  return duty.status === 'pending' && daysFromToday(parseDay(duty.dutyDate)) < 0;
}

// One row: icon, "Water plot B-12", date, tick button
function makeDutyRow(duty, onComplete) {
  const date = parseDay(duty.dutyDate);
  const done = duty.status === 'completed';
  const overdue = isOverdue(duty);

  let meta = `${relativeDay(date)} · ${shortDate.format(date)}`;
  if (overdue) meta = `${-daysFromToday(date)} days overdue · ${shortDate.format(date)}`;
  if (duty.rainExpected && !done) meta += ' · Rain expected – optional';

  const row = document.createElement('li');
  row.className = 'row';
  if (overdue) row.classList.add('row--overdue');
  if (done) row.classList.add('row--done');

  const icon = document.createElement('span');
  icon.className = 'row__icon';
  icon.append(createIcon(duty.rainExpected && !done ? 'rain' : 'drop'));

  const body = document.createElement('div');
  body.className = 'row__body';
  const title = document.createElement('p');
  title.className = 'row__title';
  title.textContent = `Water plot ${duty.plotLabel}`;
  const info = document.createElement('p');
  info.className = 'row__meta';
  info.textContent = meta;
  body.append(title, info);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'check';
  button.disabled = done;
  button.setAttribute('aria-label', done ? 'Duty completed' : `Mark watering of plot ${duty.plotLabel} as done`);
  button.append(createIcon('check'));
  button.addEventListener('click', () => onComplete(duty));

  row.append(icon, body, button);
  return row;
}

// Draws the groups Overdue / This week / Later / Done. Returns how many are still open.
function showDutyGroups(container, duties, onComplete) {
  container.replaceChildren();

  const pending = duties.filter((d) => d.status === 'pending');
  const groups = [
    ['Overdue', pending.filter((d) => isOverdue(d))],
    ['This week', pending.filter((d) => !isOverdue(d) && daysFromToday(parseDay(d.dutyDate)) <= 6)],
    ['Later', pending.filter((d) => daysFromToday(parseDay(d.dutyDate)) > 6)],
    ['Done', duties.filter((d) => d.status === 'completed').slice(-3)]
  ];

  groups.forEach(([name, list]) => {
    if (list.length === 0) return;
    const label = document.createElement('p');
    label.className = name === 'Overdue' ? 'group-label group-label--danger' : 'group-label';
    label.textContent = name;
    const rows = document.createElement('ul');
    rows.className = 'rows';
    list.forEach((duty) => rows.append(makeDutyRow(duty, onComplete)));
    container.append(label, rows);
  });

  if (container.children.length === 0) {
    container.append(emptyMessage('No duties assigned', 'Your watering duties will appear here.'));
  }
  return pending.length;
}

// PATCH /api/duties/:id/complete
async function completeDuty(duty) {
  await apiRequest(`/duties/${duty.id}/complete`, { method: 'PATCH' });
  showMessage('Duty marked as done.');
}

// The 7 small day boxes in the dark weather card
function showForecastStrip(days) {
  const strip = document.querySelector('#forecast-strip');
  strip.replaceChildren();

  days.forEach((day) => {
    const date = parseDay(day.date);
    const box = document.createElement('div');
    box.className = 'forecast-day';
    box.title = day.description;

    const name = document.createElement('span');
    name.textContent = daysFromToday(date) === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short' });
    const temp = document.createElement('strong');
    temp.textContent = `${day.tempMax}°`;
    const rain = document.createElement('span');
    rain.textContent = `${day.rainChance}%`;

    box.append(name, createIcon(day.rainExpected ? 'rain' : 'sun'), temp, rain);
    strip.append(box);
  });

  const rainyDays = days.filter((d) => d.rainExpected).length;
  document.querySelector('#weather-note').textContent = rainyDays > 0
    ? `Rain is expected on ${rainyDays} of the next 7 days. Duties on those days are optional.`
    : 'No rain expected this week. Water as planned.';
}
