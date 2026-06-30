const OUTREACH_TYPES = ['Email', 'Call', 'Meeting', 'Text', 'Other'];

async function loadOutreach(contactId) {
  const { data, error } = await _sb
    .from('outreach')
    .select('*')
    .eq('contact_id', contactId)
    .order('sent_date', { ascending: false });
  if (error) { console.error(error); return; }
  renderOutreach(data || []);
}

function renderOutreach(entries) {
  const el = document.getElementById('outreach-list');
  el.innerHTML = entries.length === 0
    ? '<div class="empty-state">No outreach logged yet.</div>'
    : entries.map(e => `
      <div class="outreach-item" id="outreach-${e.id}">
        <div class="outreach-header">
          <span class="outreach-type-badge type-${(e.type||'email').toLowerCase()}">${e.type || 'Email'}</span>
          <span class="outreach-date">${formatDate(e.sent_date)}</span>
          <div class="outreach-actions">
            <button class="icon-btn" onclick="editOutreach('${e.id}')">✏️</button>
            <button class="icon-btn danger" onclick="deleteOutreach('${e.id}')">✕</button>
          </div>
        </div>
        ${e.subject ? `<div class="outreach-subject">${escHtml(e.subject)}</div>` : ''}
        <div class="outreach-meta">
          <span class="outreach-status ${e.responded ? 'responded' : 'no-response'}">
            ${e.responded ? `✓ Responded ${e.response_date ? '· ' + formatDate(e.response_date) : ''}` : '⏳ No response yet'}
          </span>
          ${e.follow_up_date ? `<span class="outreach-followup ${isDatePast(e.follow_up_date) && !e.responded ? 'overdue' : ''}">Follow up: ${formatDate(e.follow_up_date)}</span>` : ''}
        </div>
        ${e.notes ? `<div class="outreach-notes">${escHtml(e.notes)}</div>` : ''}
      </div>
    `).join('');
}

function openOutreachModal(existingId = null) {
  let entry = {};
  if (existingId) {
    const el = document.getElementById('outreach-modal');
    el.dataset.editId = existingId;
  } else {
    const el = document.getElementById('outreach-modal');
    delete el.dataset.editId;
  }

  document.getElementById('outreach-modal-title').textContent = existingId ? 'Edit Outreach' : 'Log Outreach';
  document.getElementById('outreach-type').value = entry.type || 'Email';
  document.getElementById('outreach-sent-date').value = entry.sent_date || new Date().toISOString().split('T')[0];
  document.getElementById('outreach-subject').value = entry.subject || '';
  document.getElementById('outreach-responded').checked = entry.responded || false;
  document.getElementById('outreach-response-date').value = entry.response_date || '';
  document.getElementById('outreach-followup-date').value = entry.follow_up_date || '';
  document.getElementById('outreach-notes').value = entry.notes || '';

  document.getElementById('outreach-modal').style.display = 'flex';
}

async function editOutreach(id) {
  const { data, error } = await _sb.from('outreach').select('*').eq('id', id).single();
  if (error || !data) return;

  document.getElementById('outreach-modal-title').textContent = 'Edit Outreach';
  document.getElementById('outreach-modal').dataset.editId = id;
  document.getElementById('outreach-type').value = data.type || 'Email';
  document.getElementById('outreach-sent-date').value = data.sent_date || '';
  document.getElementById('outreach-subject').value = data.subject || '';
  document.getElementById('outreach-responded').checked = data.responded || false;
  document.getElementById('outreach-response-date').value = data.response_date || '';
  document.getElementById('outreach-followup-date').value = data.follow_up_date || '';
  document.getElementById('outreach-notes').value = data.notes || '';

  document.getElementById('outreach-modal').style.display = 'flex';
}

function closeOutreachModal() {
  document.getElementById('outreach-modal').style.display = 'none';
}

async function saveOutreach() {
  const modal = document.getElementById('outreach-modal');
  const editId = modal.dataset.editId;

  const payload = {
    contact_id: activeContactId,
    type: document.getElementById('outreach-type').value,
    sent_date: document.getElementById('outreach-sent-date').value || null,
    subject: document.getElementById('outreach-subject').value || null,
    responded: document.getElementById('outreach-responded').checked,
    response_date: document.getElementById('outreach-response-date').value || null,
    follow_up_date: document.getElementById('outreach-followup-date').value || null,
    notes: document.getElementById('outreach-notes').value || null,
  };

  if (editId) {
    const { error } = await _sb.from('outreach').update(payload).eq('id', editId);
    if (error) { showToast('Error saving.', 'error'); return; }
  } else {
    payload.created_at = new Date().toISOString();
    const { error } = await _sb.from('outreach').insert(payload);
    if (error) { showToast('Error saving.', 'error'); return; }
  }

  closeOutreachModal();
  await loadOutreach(activeContactId);
  showToast('Outreach saved.');
}

async function deleteOutreach(id) {
  if (!confirm('Delete this outreach entry?')) return;
  await _sb.from('outreach').delete().eq('id', id);
  await loadOutreach(activeContactId);
}

function isDatePast(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}
