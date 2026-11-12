// My loans: return a tool and report damage (owner: Mayan)
// GET   /api/loans
// PATCH /api/loans/:id/return   { condition }
// POST  /api/tools/:id/report   { note }

const activeList = document.querySelector('#active-list');
const historyBody = document.querySelector('#history-body');

function makeLoanRow(loan) {
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

  // Condition drop-down + Return + Report damage
  const condition = document.createElement('select');
  condition.className = 'select select--sm';
  condition.setAttribute('aria-label', `Condition of ${loan.toolName}`);
  ['good', 'fair', 'damaged'].forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = statusText(value);
    condition.append(option);
  });

  const returnButton = document.createElement('button');
  returnButton.type = 'button';
  returnButton.className = 'btn btn--primary btn--sm';
  returnButton.textContent = 'Return';
  returnButton.setAttribute('aria-label', `Return ${loan.toolName}`);
  returnButton.addEventListener('click', () => returnTool(loan, condition.value));

  const reportButton = document.createElement('button');
  reportButton.type = 'button';
  reportButton.className = 'btn btn--ghost btn--sm';
  reportButton.textContent = 'Report damage';
  reportButton.setAttribute('aria-label', `Report ${loan.toolName} as damaged`);
  reportButton.addEventListener('click', () => reportDamage(loan));

  const actions = document.createElement('div');
  actions.className = 'loan-actions';
  actions.append(condition, returnButton, reportButton);

  row.append(icon, body, actions);
  return row;
}

function showLoans(loans) {
  const onLoan = loans.filter((l) => l.status === 'on_loan');
  const returned = loans.filter((l) => l.status === 'returned');

  activeList.replaceChildren();
  if (onLoan.length === 0) {
    activeList.append(emptyMessage('Nothing borrowed', 'Tools you borrow will show up here.'));
  }
  onLoan.forEach((loan) => activeList.append(makeLoanRow(loan)));
  document.querySelector('#active-count').textContent = `${onLoan.length} on loan`;

  historyBody.replaceChildren();
  if (returned.length === 0) {
    historyBody.append(emptyRow(5, 'No returned tools yet'));
  }
  returned.forEach((loan) => {
    const row = document.createElement('tr');
    row.append(
      makeCell('Tool', loan.toolName),
      makeCell('Category', loan.category),
      makeCell('Borrowed', shortDate.format(new Date(loan.checkoutDate))),
      makeCell('Returned', shortDate.format(new Date(loan.returnDate))),
      makeCell('Condition', makeBadge(loan.returnCondition))
    );
    historyBody.append(row);
  });
}

async function returnTool(loan, condition) {
  try {
    await sendJson(`/loans/${loan.id}/return`, 'PATCH', { condition });
    showMessage(`${loan.toolName} returned. Thank you!`);
    loadLoans();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function reportDamage(loan) {
  try {
    await sendJson(`/tools/${loan.toolId}/report`, 'POST', { note: 'Reported by the borrower' });
    showMessage(`Thanks, the committee knows ${loan.toolName} is damaged.`);
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadLoans() {
  try {
    const loans = await apiRequest('/loans');
    showLoans(loans);
  } catch (error) {
    activeList.replaceChildren(emptyMessage('Could not load your loans', error.message));
  }
}

if (pageAllowed) {
  loadLoans();
}
