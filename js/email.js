// Email templates
const EMAIL_TEMPLATES = {
  prospective: {
    label: 'Initial Outreach',
    subject: 'Partnership Opportunity — La Ofrenda Festival 2026',
    body: `Hi {{name}},

I hope this message finds you well! I'm reaching out on behalf of La Ofrenda Festival, Gilroy's annual Dia de Muertos Festival & Wellness Fair taking place October 24th, 2026 in downtown Gilroy.

We're building a vibrant celebration of culture and community, and we'd love to explore a partnership with {{org}}. Our sponsorship opportunities range from community partnerships to presenting sponsorships, each with meaningful visibility and impact.

Would you be open to a brief conversation about how we might collaborate?

Looking forward to hearing from you,
La Ofrenda Festival Team`,
  },
  followup: {
    label: 'Follow-Up (No Response)',
    subject: 'Following Up — La Ofrenda Festival Partnership',
    body: `Hi {{name}},

I wanted to follow up on my previous message about a potential partnership with La Ofrenda Festival. We're continuing to build out our sponsor family for our October 24th, 2026 event in downtown Gilroy.

If you have any questions or would like to learn more about our sponsorship levels, I'd be happy to connect at your convenience.

Thank you for your time,
La Ofrenda Festival Team`,
  },
  committed: {
    label: 'Thank You / Welcome',
    subject: 'Welcome to La Ofrenda Festival — Thank You, {{org}}!',
    body: `Hi {{name}},

Thank you so much for partnering with La Ofrenda Festival! We're thrilled to have {{org}} as part of our community.

We'll be in touch shortly with next steps and details about your sponsorship benefits. In the meantime, feel free to reach out with any questions.

With gratitude,
La Ofrenda Festival Team`,
  },
};

let selectedEmailContacts = new Set();

async function initEmailTab() {
  const templateSel = document.getElementById('email-template-select');
  templateSel.innerHTML = Object.entries(EMAIL_TEMPLATES).map(([k, t]) =>
    `<option value="${k}">${t.label}</option>`
  ).join('');
  loadEmailTemplate();
  await loadEmailContactList();
}

function loadEmailTemplate() {
  const key = document.getElementById('email-template-select').value;
  const tpl = EMAIL_TEMPLATES[key];
  if (!tpl) return;
  document.getElementById('email-subject').value = tpl.subject;
  document.getElementById('email-body').value = tpl.body;
}

async function loadEmailContactList(filter) {
  let query = _sb.from('contacts').select('id, name, org_name, email, status, sponsorship_level').order('org_name');

  if (filter === 'prospective') {
    query = query.in('status', ['Not Contacted', 'Reached Out']);
  } else if (filter === 'no-response') {
    query = query.eq('status', 'Reached Out');
  } else if (filter === 'committed') {
    query = query.eq('status', 'Committed');
  }

  const { data } = await query;
  renderEmailContactList(data || []);
}

function renderEmailContactList(contacts) {
  const list = document.getElementById('email-contact-list');
  list.innerHTML = contacts.map(c => `
    <div class="email-contact-row ${!c.email ? 'no-email' : ''} ${selectedEmailContacts.has(c.id) ? 'selected' : ''}"
      onclick="${c.email ? `toggleEmailContactRow('${c.id}')` : ''}">
      <input type="checkbox" value="${c.id}"
        ${selectedEmailContacts.has(c.id) ? 'checked' : ''}
        ${!c.email ? 'disabled' : ''}
        onclick="event.stopPropagation()"
        onchange="toggleEmailContact('${c.id}', this.checked)">
      <span class="email-contact-name">${c.name || '—'}</span>
      <span class="email-contact-org">${c.org_name || ''}</span>
      <span class="email-contact-addr">${c.email || '<em>no email</em>'}</span>
      <span class="badge status-badge status-${slugify(c.status)}">${c.status || ''}</span>
    </div>
  `).join('') || '<div class="empty-state">No contacts match this filter.</div>';
  updateSelectedCount();
}

function toggleEmailContactRow(id) {
  const isSelected = selectedEmailContacts.has(id);
  if (isSelected) selectedEmailContacts.delete(id);
  else selectedEmailContacts.add(id);
  // update checkbox and row highlight without full re-render
  const rows = document.querySelectorAll(`#email-contact-list .email-contact-row`);
  rows.forEach(row => {
    const cb = row.querySelector('input[type=checkbox]');
    if (cb && cb.value === id) {
      cb.checked = !isSelected;
      row.classList.toggle('selected', !isSelected);
    }
  });
  updateSelectedCount();
}

function toggleEmailContact(id, checked) {
  if (checked) selectedEmailContacts.add(id);
  else selectedEmailContacts.delete(id);
  updateSelectedCount();
}

function selectAllEmailContacts() {
  document.querySelectorAll('#email-contact-list input[type=checkbox]:not(:disabled)').forEach(cb => {
    cb.checked = true;
    selectedEmailContacts.add(cb.value);
  });
  updateSelectedCount();
}

function clearEmailSelection() {
  selectedEmailContacts.clear();
  document.querySelectorAll('#email-contact-list input[type=checkbox]').forEach(cb => cb.checked = false);
  updateSelectedCount();
}

function updateSelectedCount() {
  document.getElementById('selected-count').textContent = `${selectedEmailContacts.size} selected`;
}

function previewEmail() {
  if (selectedEmailContacts.size === 0) { showToast('Select at least one contact.', 'error'); return; }
  const subject = document.getElementById('email-subject').value;
  const body = document.getElementById('email-body').value;
  const contacts = allContacts.filter(c => selectedEmailContacts.has(c.id));

  // Build mailto with first contact as preview
  const c = contacts[0];
  const personalizedBody = personalizeTemplate(body, c);
  const personalizedSubject = personalizeTemplate(subject, c);

  const previewEl = document.getElementById('email-preview');
  previewEl.innerHTML = `
    <div class="preview-note">Preview for: <strong>${c.name || c.org_name}</strong>
      ${contacts.length > 1 ? ` (+${contacts.length - 1} more)` : ''}</div>
    <div class="preview-subject"><strong>Subject:</strong> ${escHtml(personalizedSubject)}</div>
    <div class="preview-body">${escHtml(personalizedBody)}</div>
  `;
  previewEl.style.display = 'block';
}

function sendEmails() {
  if (selectedEmailContacts.size === 0) { showToast('Select at least one contact.', 'error'); return; }
  const subject = document.getElementById('email-subject').value;
  const body = document.getElementById('email-body').value;
  const contacts = allContacts.filter(c => selectedEmailContacts.has(c.id) && c.email);

  if (contacts.length === 0) { showToast('None of the selected contacts have email addresses.', 'error'); return; }

  // Open mailto with all recipients in BCC for privacy
  const emails = contacts.map(c => c.email).join(',');
  const firstContact = contacts[0];
  const personalizedSubject = personalizeTemplate(subject, firstContact);
  const personalizedBody = personalizeTemplate(body, firstContact);

  const mailto = `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`;
  window.open(mailto);

  // Log the emails
  logEmailSent(contacts, personalizedSubject);
}

async function logEmailSent(contacts, subject) {
  const rows = contacts.map(c => ({
    contact_id: c.id,
    subject,
    sent_at: new Date().toISOString(),
  }));
  await _sb.from('email_log').insert(rows);

  // Update status for "Not Contacted" → "Reached Out"
  const notContacted = contacts.filter(c => c.status === 'Not Contacted').map(c => c.id);
  if (notContacted.length > 0) {
    await _sb.from('contacts').update({ status: 'Reached Out' }).in('id', notContacted);
    notContacted.forEach(id => {
      const c = allContacts.find(x => x.id === id);
      if (c) c.status = 'Reached Out';
    });
  }
  showToast(`Logged emails to ${contacts.length} contact(s).`);
}

function personalizeTemplate(text, contact) {
  return text
    .replace(/{{name}}/g, contact?.name || 'there')
    .replace(/{{org}}/g, contact?.org_name || 'your organization');
}

async function filterEmailList() {
  const filter = document.getElementById('email-filter').value;
  selectedEmailContacts.clear();
  await loadEmailContactList(filter);
}
