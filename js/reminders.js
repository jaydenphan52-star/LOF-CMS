async function loadReminders(contactId) {
  const { data, error } = await _sb
    .from('reminders')
    .select('*')
    .eq('contact_id', contactId)
    .order('due_date');
  if (error) { console.error(error); return; }
  renderReminders(data || []);
}

function renderReminders(reminders) {
  const el = document.getElementById('reminders-list');
  el.innerHTML = reminders.length === 0
    ? '<div class="empty-state">No action items.</div>'
    : reminders.map(r => `
      <div class="reminder-item ${r.done ? 'done' : ''} ${isOverdue(r) ? 'overdue' : ''}" id="rem-${r.id}">
        <input type="checkbox" ${r.done ? 'checked' : ''} onchange="toggleReminder('${r.id}', this.checked)">
        <div class="reminder-body" id="rem-body-${r.id}">
          <span class="reminder-text">${escHtml(r.text)}</span>
          ${r.due_date ? `<span class="reminder-due ${isOverdue(r) ? 'overdue-text' : ''}">${formatDate(r.due_date)}</span>` : ''}
        </div>
        <div class="reminder-edit-form" id="rem-edit-${r.id}" style="display:none; flex:1; gap:.4rem; align-items:center;">
          <input type="text" value="${escHtml(r.text)}" id="rem-edit-text-${r.id}" style="flex:1;" />
          <input type="date" value="${r.due_date || ''}" id="rem-edit-date-${r.id}" style="width:130px;" />
          <button class="btn-primary" style="padding:.35rem .6rem; font-size:.78rem;" onclick="saveReminderEdit('${r.id}')">Save</button>
          <button class="btn-secondary" style="padding:.35rem .6rem; font-size:.78rem;" onclick="cancelReminderEdit('${r.id}')">✕</button>
        </div>
        <button class="icon-btn" onclick="startReminderEdit('${r.id}')">✏️</button>
        <button class="icon-btn danger" onclick="deleteReminder('${r.id}')">✕</button>
      </div>
    `).join('');
}

function startReminderEdit(id) {
  document.getElementById(`rem-body-${id}`).style.display = 'none';
  document.getElementById(`rem-edit-${id}`).style.display = 'flex';
}

function cancelReminderEdit(id) {
  document.getElementById(`rem-body-${id}`).style.display = 'flex';
  document.getElementById(`rem-edit-${id}`).style.display = 'none';
}

async function saveReminderEdit(id) {
  const text = document.getElementById(`rem-edit-text-${id}`).value.trim();
  const due_date = document.getElementById(`rem-edit-date-${id}`).value || null;
  if (!text) return;
  const { error } = await _sb.from('reminders').update({ text, due_date }).eq('id', id);
  if (error) { showToast('Error saving.', 'error'); return; }
  await loadReminders(activeContactId);
  showToast('Updated.');
}

async function addReminder() {
  const text = document.getElementById('new-reminder-text').value.trim();
  const due = document.getElementById('new-reminder-date').value;
  if (!text || !activeContactId) return;

  const { error } = await _sb.from('reminders').insert({
    contact_id: activeContactId,
    text,
    due_date: due || null,
    done: false,
    created_at: new Date().toISOString(),
  });

  if (error) { showToast('Error adding reminder.', 'error'); return; }
  document.getElementById('new-reminder-text').value = '';
  document.getElementById('new-reminder-date').value = '';
  await loadReminders(activeContactId);
  showToast('Action item added.');
}

async function toggleReminder(id, done) {
  await _sb.from('reminders').update({ done }).eq('id', id);
  await loadReminders(activeContactId);
}

async function deleteReminder(id) {
  await _sb.from('reminders').delete().eq('id', id);
  await loadReminders(activeContactId);
}

// Global reminders view (all contacts)
async function loadAllReminders() {
  const { data, error } = await _sb
    .from('reminders')
    .select('*, contacts(name, org_name)')
    .eq('done', false)
    .order('due_date');
  if (error) { console.error(error); return; }
  renderAllReminders(data || []);
}

function renderAllReminders(reminders) {
  const el = document.getElementById('all-reminders-list');
  if (!el) return;
  el.innerHTML = reminders.length === 0
    ? '<div class="empty-state">No pending action items.</div>'
    : reminders.map(r => `
      <div class="reminder-item ${isOverdue(r) ? 'overdue' : ''}">
        <input type="checkbox" onchange="toggleReminderGlobal('${r.id}', this.checked)">
        <div class="reminder-body">
          <span class="reminder-text">${escHtml(r.text)}</span>
          <span class="reminder-contact" onclick="openContact('${r.contact_id}'); switchTab('contacts')">
            ${r.contacts?.name || ''} ${r.contacts?.org_name ? '· ' + r.contacts.org_name : ''}
          </span>
          ${r.due_date ? `<span class="reminder-due ${isOverdue(r) ? 'overdue-text' : ''}">${formatDate(r.due_date)}</span>` : ''}
        </div>
      </div>
    `).join('');
}

async function toggleReminderGlobal(id, done) {
  await _sb.from('reminders').update({ done }).eq('id', id);
  await loadAllReminders();
}

function isOverdue(r) {
  if (r.done || !r.due_date) return false;
  return new Date(r.due_date) < new Date();
}
