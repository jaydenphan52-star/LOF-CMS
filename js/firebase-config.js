const firebaseConfig = {
  apiKey: "AIzaSyDO5GCPFRRjGCCtAjKPzjRRxXpSyP_F2Cs",
  authDomain: "lof-cms.firebaseapp.com",
  projectId: "lof-cms",
  storageBucket: "lof-cms.firebasestorage.app",
  messagingSenderId: "363121835159",
  appId: "1:363121835159:web:3781be652dc2df21dffdd2",
  measurementId: "G-8GET553TZD"
};

firebase.initializeApp(firebaseConfig);
window._auth = firebase.auth();
