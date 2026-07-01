// Global helpers
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function switchTab(tab) {
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'flex';
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));

  if (tab === 'reminders') loadAllReminders();
  if (tab === 'email') initEmailTab();
}

function mobileBackToList() {
  document.getElementById('detail-panel').style.display = 'none';
  document.getElementById('no-selection').style.display = 'flex';
  document.querySelector('.list-col').classList.remove('mobile-hidden');
  document.querySelector('.detail-col').classList.remove('mobile-show');
  activeContactId = null;
  renderContactList(allContacts);
}

async function initApp() {
  // Populate filter dropdowns
  const levelFilter = document.getElementById('level-filter');
  levelFilter.innerHTML = '<option value="">All Levels</option>' +
    SPONSORSHIP_LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');

  const statusFilter = document.getElementById('status-filter');
  statusFilter.innerHTML = '<option value="">All Statuses</option>' +
    CONTACT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');

  // Populate edit dropdowns
  const editLevel = document.getElementById('edit-level');
  editLevel.innerHTML = SPONSORSHIP_LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');

  const editStatus = document.getElementById('edit-status');
  editStatus.innerHTML = CONTACT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');

  await loadContacts();
  switchTab('contacts');
}
