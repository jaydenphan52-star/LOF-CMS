function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  _auth.signInWithPopup(provider).catch(err => {
    document.getElementById('login-error').textContent = err.message;
  });
}

function signOut() {
  _auth.signOut();
}

_auth.onAuthStateChanged(async user => {
  if (!user) {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    return;
  }

  // Check Firestore admins collection, fallback to hardcoded list during transition
  const FALLBACK = ['jaydenphan52@gmail.com', 'ruben@fuchilafresheners.com'];
  let allowed = FALLBACK.includes(user.email);

  try {
    const doc = await _db.collection('admins').doc(user.email).get();
    if (doc.exists) allowed = true;
  } catch (e) {
    // Firestore unavailable — rely on fallback
  }

  if (allowed) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('user-name').textContent = user.displayName || user.email;
    initApp();
  } else {
    _auth.signOut();
    document.getElementById('login-error').textContent = 'Access denied. This CMS is private.';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});
