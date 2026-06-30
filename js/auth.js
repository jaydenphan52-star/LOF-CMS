// Whitelist — only this email can access the CMS
const ALLOWED_EMAIL = 'jaydenphan52@gmail.com';

function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  _auth.signInWithPopup(provider).catch(err => {
    document.getElementById('login-error').textContent = err.message;
  });
}

function signOut() {
  _auth.signOut();
}

_auth.onAuthStateChanged(user => {
  if (user && user.email === ALLOWED_EMAIL) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('user-name').textContent = user.displayName || user.email;
    initApp();
  } else if (user) {
    // Wrong account
    _auth.signOut();
    document.getElementById('login-error').textContent = 'Access denied. This CMS is private.';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});
