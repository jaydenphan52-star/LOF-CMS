function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  _auth.signInWithPopup(provider).catch(err => {
    document.getElementById('login-error').textContent = err.message;
  });
}

function signOut() {
  _auth.signOut();
}

const ALLOWED_EMAILS = ['jaydenphan52@gmail.com', 'ruben@fuchilafresheners.com'];

_auth.onAuthStateChanged(async user => {
  if (!user) {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    return;
  }

  // Let hardcoded users in immediately, then also check Firestore for any extras
  if (ALLOWED_EMAILS.includes(user.email)) {
    grantAccess(user);
    return;
  }

  // For everyone else, check Firestore admins collection
  try {
    const doc = await _db.collection('admins').doc(user.email).get();
    if (doc.exists) { grantAccess(user); return; }
  } catch (e) {}

  // Not allowed
  _auth.signOut();
  document.getElementById('login-error').textContent = 'Access denied. This CMS is private.';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
});

function grantAccess(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-name').textContent = user.displayName || user.email;
  initApp();
}
