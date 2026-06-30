async function loadNotes(contactId) {
  const { data, error } = await _sb
    .from('notes')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  renderNotes(data || []);
}

function renderNotes(notes) {
  const el = document.getElementById('notes-list');
  el.innerHTML = notes.length === 0
    ? '<div class="empty-state">No notes yet.</div>'
    : notes.map(n => `
      <div class="note-item" id="note-${n.id}">
        <div class="note-header">
          <span class="note-date">${formatDate(n.created_at)}</span>
          <button class="icon-btn danger" onclick="deleteNote('${n.id}')">✕</button>
        </div>
        <div class="note-body">${escHtml(n.body)}</div>
      </div>
    `).join('');
}

async function addNote() {
  const body = document.getElementById('new-note-input').value.trim();
  if (!body || !activeContactId) return;

  const { data, error } = await _sb.from('notes').insert({
    contact_id: activeContactId,
    body,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) { showToast('Error adding note.', 'error'); return; }
  document.getElementById('new-note-input').value = '';
  await loadNotes(activeContactId);
  showToast('Note added.');
}

async function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  await _sb.from('notes').delete().eq('id', id);
  await loadNotes(activeContactId);
}
