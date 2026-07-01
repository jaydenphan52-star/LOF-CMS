function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  _auth.signInWithPopup(provider).catch(err => {
    document.getElementById('login-error').textContent = err.message;
  });
}

function signOut() {
  _auth.signOut();
}

// To add a new user: add their Google email to this list and push
const ALLOWED_EMAILS = [
  'jaydenphan52@gmail.com',
  'ruben@fuchilafresheners.com',
];

_auth.onAuthStateChanged(user => {
  if (!user) {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    return;
  }

  if (ALLOWED_EMAILS.includes(user.email)) {
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
