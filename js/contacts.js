const SPONSORSHIP_LEVELS = [
  'Prospective',
  'Cempasúchil Presenting Partner',
  'Colibri Community Partner',
  'Mariposa Media Partner',
  'Copal Community Partner',
  'Contributing Sponsor',
  'Founding Partner',
  'County of Santa Clara Partner',
];

const CONTACT_STATUSES = ['Not Contacted', 'Reached Out', 'In Conversation', 'Committed', 'Declined'];

let allContacts = [];
let activeContactId = null;

async function loadContacts() {
  const { data, error } = await _sb.from('contacts').select('*').order('org_name');
  if (error) { console.error(error); return; }
  allContacts = data || [];
  renderContactList(allContacts);
}

function renderContactList(contacts) {
  const list = document.getElementById('contact-list');
  const search = document.getElementById('contact-search').value.toLowerCase();
  const levelFilter = document.getElementById('level-filter').value;
  const statusFilter = document.getElementById('status-filter').value;

  let filtered = contacts.filter(c => {
    const matchSearch = !search ||
      (c.name || '').toLowerCase().includes(search) ||
      (c.org_name || '').toLowerCase().includes(search) ||
      (c.email || '').toLowerCase().includes(search);
    const matchLevel = !levelFilter || c.sponsorship_level === levelFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchLevel && matchStatus;
  });

  list.innerHTML = filtered.length === 0
    ? '<div class="empty-state">No contacts found.</div>'
    : filtered.map(c => `
      <div class="contact-row ${c.id === activeContactId ? 'active' : ''}" onclick="openContact('${c.id}')">
        <div class="contact-row-main">
          <span class="contact-row-name">${c.name || '—'}</span>
          <span class="contact-row-org">${c.org_name || ''}</span>
        </div>
        <div class="contact-row-meta">
          <span class="badge level-badge">${c.sponsorship_level || 'Prospective'}</span>
          <span class="badge status-badge status-${slugify(c.status)}">${c.status || 'Not Contacted'}</span>
        </div>
      </div>
    `).join('');
}

async function openContact(id) {
  activeContactId = id;
  renderContactList(allContacts);
  const contact = allContacts.find(c => c.id === id);
  if (!contact) return;

  document.getElementById('detail-panel').style.display = 'flex';
  document.getElementById('no-selection').style.display = 'none';
  // Mobile: hide list, show detail
  document.querySelector('.list-col').classList.add('mobile-hidden');
  document.querySelector('.detail-col').classList.add('mobile-show');
  populateDetail(contact);
  await loadNotes(id);
  await loadReminders(id);
  await loadOutreach(id);
}

function populateDetail(c) {
  document.getElementById('detail-name').textContent = c.name || 'Unnamed';
  document.getElementById('detail-org').textContent = c.org_name || '';

  // Editable fields
  setField('edit-name', c.name);
  setField('edit-org', c.org_name);
  setField('edit-email', c.email);
  setField('edit-phone', c.phone);
  setField('edit-website', c.website);
  setSelectField('edit-level', c.sponsorship_level);
  setSelectField('edit-status', c.status);
  setField('edit-contact-notes', c.contact_notes);
}

async function saveContactEdits() {
  const updates = {
    name: document.getElementById('edit-name').value,
    org_name: document.getElementById('edit-org').value,
    email: document.getElementById('edit-email').value,
    phone: document.getElementById('edit-phone').value,
    website: document.getElementById('edit-website').value,
    sponsorship_level: document.getElementById('edit-level').value,
    status: document.getElementById('edit-status').value,
    contact_notes: document.getElementById('edit-contact-notes').value,
    updated_at: new Date().toISOString(),
  };

  const { error } = await _sb.from('contacts').update(updates).eq('id', activeContactId);
  if (error) { showToast('Error saving: ' + error.message, 'error'); return; }

  const idx = allContacts.findIndex(c => c.id === activeContactId);
  if (idx >= 0) allContacts[idx] = { ...allContacts[idx], ...updates };
  populateDetail(allContacts[idx]);
  renderContactList(allContacts);
  showToast('Contact saved.');
}

async function deleteContact() {
  if (!confirm('Delete this contact? This cannot be undone.')) return;
  await _sb.from('notes').delete().eq('contact_id', activeContactId);
  await _sb.from('reminders').delete().eq('contact_id', activeContactId);
  const { error } = await _sb.from('contacts').delete().eq('id', activeContactId);
  if (error) { showToast('Error deleting.', 'error'); return; }
  allContacts = allContacts.filter(c => c.id !== activeContactId);
  activeContactId = null;
  document.getElementById('detail-panel').style.display = 'none';
  document.getElementById('no-selection').style.display = 'flex';
  renderContactList(allContacts);
  showToast('Contact deleted.');
}

async function addContact() {
  const name = prompt('Contact name:');
  if (!name) return;
  const org = prompt('Organization name:');

  const { data, error } = await _sb.from('contacts').insert({
    name,
    org_name: org || '',
    sponsorship_level: 'Prospective',
    status: 'Not Contacted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select().single();

  if (error) { showToast('Error adding contact.', 'error'); return; }
  allContacts.push(data);
  renderContactList(allContacts);
  openContact(data.id);
  showToast('Contact added.');
}

// Helpers
function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
function setSelectField(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = val || el.options[0]?.value || '';
}
function slugify(str) {
  return (str || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
