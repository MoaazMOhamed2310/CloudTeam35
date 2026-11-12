// Apply for a plot + my applications (owner: Moaaz)
// POST  /api/applications               { season, note }  (+ Turnstile token)
// GET   /api/applications               my applications
// PATCH /api/applications/:id/withdraw  only while pending

const applicationForm = document.querySelector('#application-form');
const seasonInput = document.querySelector('#season');
const noteInput = document.querySelector('#note');
const formMessage = document.querySelector('#application-form-error');
const appsBody = document.querySelector('#apps-body');

let myApplications = [];
let chosenStatus = '';

// Draw the Turnstile widget (Lab 5 Part O1)
let turnstileWidgetId = null;
if (window.turnstile) {
  turnstileWidgetId = turnstile.render('#turnstile-widget', { sitekey: TURNSTILE_SITE_KEY });
}

// ---------------- Table ----------------
function showApplications() {
  const shown = myApplications.filter((app) => chosenStatus === '' || app.status === chosenStatus);
  appsBody.replaceChildren();

  if (shown.length === 0) {
    appsBody.append(emptyRow(6, 'No applications here', 'Use the form to apply for a plot.'));
  }

  shown.forEach((app) => {
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
    appsBody.append(row);
  });

  document.querySelector('#apps-count').textContent = `Showing ${shown.length} of ${myApplications.length} applications`;
}

async function loadApplications() {
  try {
    myApplications = await apiRequest('/applications');
    showApplications();
  } catch (error) {
    appsBody.replaceChildren(emptyRow(6, 'Could not load applications', error.message));
  }
}

// ---------------- Withdraw ----------------
async function withdrawApplication(app) {
  try {
    await apiRequest(`/applications/${app.id}/withdraw`, { method: 'PATCH' });
    showMessage('Application withdrawn.');
    loadApplications();
  } catch (error) {
    showMessage(error.message, true);
  }
}

// ---------------- Form ----------------
noteInput.addEventListener('input', () => {
  document.querySelector('#note-count').textContent = `${noteInput.value.length} / 300`;
});

applicationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (seasonInput.value === '') {
    formMessage.textContent = 'Please choose a season.';
    return;
  }

  const turnstileToken = window.turnstile ? turnstile.getResponse(turnstileWidgetId) : '';
  if (!turnstileToken) {
    formMessage.textContent = 'Please complete the bot check first.';
    return;
  }

  try {
    formMessage.textContent = '';
    await sendJson('/applications', 'POST',
      { season: seasonInput.value, note: noteInput.value.trim() },
      { 'X-Turnstile-Token': turnstileToken });
    applicationForm.reset();
    document.querySelector('#note-count').textContent = '0 / 300';
    showMessage('Application submitted. The committee will review it.');
    loadApplications();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    if (window.turnstile) {
      turnstile.reset(turnstileWidgetId);
    }
  }
});

// Filter buttons
document.querySelectorAll('#app-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#app-chips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    chip.setAttribute('aria-pressed', 'true');
    chosenStatus = chip.dataset.status;
    showApplications();
  });
});

if (pageAllowed) {
  loadApplications();
}
