// Shared code for every page inside resident/ and admin/:
// login check, top bar, messages, badges, icons and dates.

// ---------- Who is signed in ----------
const currentUser = getUser();
const pageRole = document.body.dataset.role;   // "resident" or "admin"

// Send people who are not signed in, or have the wrong role, to the right page.
// This only helps the user. The real check is in the backend (401 / 403).
function checkLogin() {
  if (!currentUser) {
    window.location.href = '../login.html';
    return false;
  }
  if (currentUser.role !== pageRole) {
    window.location.href = `../${currentUser.role}/dashboard.html`;
    return false;
  }
  return true;
}

const pageAllowed = checkLogin();

// ---------- Top bar ----------
function showUser() {
  if (!currentUser) return;
  const initials = currentUser.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
  document.querySelector('#user-avatar').textContent = initials;
  document.querySelector('#user-chip-name').textContent = currentUser.name;
  if (currentUser.role === 'admin') {
    document.querySelector('#user-role').hidden = false;
  }
}

function setupMenu() {
  const toggle = document.querySelector('.topbar__toggle');
  const nav = document.querySelector('#site-nav');
  document.documentElement.classList.add('js');   // lets the CSS hide the menu on small screens

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.querySelector('[data-logout]').addEventListener('click', () => {
    logout();
  });
}

showUser();
setupMenu();

// ---------- Messages (small pop-up in the corner) ----------
function showMessage(text, isError = false) {
  const message = document.createElement('div');
  message.className = isError ? 'toast toast--error' : 'toast';
  message.textContent = text;
  document.querySelector('#toast-region').append(message);
  setTimeout(() => message.remove(), 3500);
}

// ---------- Status badges ----------
const STATUS_LABELS = {
  pending: ['Pending', 'warning'],
  approved: ['Approved', 'success'],
  rejected: ['Rejected', 'danger'],
  withdrawn: ['Withdrawn', 'neutral'],
  available: ['Available', 'success'],
  assigned: ['Assigned', 'info'],
  maintenance: ['Maintenance', 'warning'],
  on_loan: ['On loan', 'info'],
  returned: ['Returned', 'neutral'],
  damaged: ['Damaged', 'danger'],
  good: ['Good', 'success'],
  fair: ['Fair', 'warning'],
  completed: ['Completed', 'success'],
  cancelled: ['Cancelled', 'neutral'],
  overdue: ['Overdue', 'danger']
};

function statusText(status) {
  return STATUS_LABELS[status] ? STATUS_LABELS[status][0] : status;
}

function makeBadge(status) {
  const badge = document.createElement('span');
  const tone = STATUS_LABELS[status] ? STATUS_LABELS[status][1] : 'neutral';
  badge.className = `badge badge--${tone}`;
  badge.textContent = statusText(status);
  return badge;
}

// ---------- Icons from the sprite at the top of the page ----------
function createIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

// ---------- Empty states ----------
function emptyMessage(title, text = '') {
  const box = document.createElement('div');
  box.className = 'empty';
  const strong = document.createElement('strong');
  strong.textContent = title;
  box.append(strong, text);
  return box;
}

function emptyRow(columns, title, text = '') {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = columns;
  cell.append(emptyMessage(title, text));
  row.append(cell);
  return row;
}

// One table cell with a label (the label is shown on phones)
function makeCell(label, content) {
  const cell = document.createElement('td');
  cell.dataset.label = label;
  if (typeof content === 'string') {
    cell.textContent = content;
  } else {
    cell.append(content);
  }
  return cell;
}

// ---------- Dates ----------
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// "2026-11-15" -> a Date at midnight on that day
function parseDay(text) {
  const [year, month, day] = text.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Today's date as "2026-11-12"
function todayText() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// How many days from today (negative = in the past)
function daysFromToday(date) {
  const today = parseDay(todayText());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((day - today) / 86400000);
}

function relativeDay(date) {
  const days = daysFromToday(date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `In ${days} days`;
  return `${-days} days ago`;
}
