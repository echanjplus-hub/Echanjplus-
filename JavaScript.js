// Konfigirasyon ou a
const firebaseConfig = {
  apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
  authDomain: "echanj-plus-778cd.firebaseapp.com",
  databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
  projectId: "echanj-plus-778cd",
  storageBucket: "echanj-plus-778cd.firebasestorage.app",
  messagingSenderId: "111144762929",
  appId: "1:111144762929:web:e64ce9a6da65781c289f10"
};

// Inisyalizasyon
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Chanje ant Login ak Signup
function toggleAuth() {
    const s = document.getElementById('signup-form');
    const l = document.getElementById('login-form');
    s.style.display = s.style.display === 'none' ? 'block' : 'none';
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
}

// ENSKRIPSYON
async function handleSignup() {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const name = document.getElementById('reg-fullname').value;
    const phone = document.getElementById('reg-phone').value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;

    try {
        const res = await auth.createUserWithEmailAndPassword(email, pass);
        // Sere enfòmasyon anplis nan Firestore
        await db.collection("users").doc(res.user.uid).set({
            fullname: name,
            phone: phone,
            email: email,
            gender: gender,
            balance: 0,
            uid: res.user.uid
        });
        alert("Bravo! Kont ou kreye.");
        // Redirije bò isit la pou paj profil la
    } catch (err) {
        alert("Erè: " + err.message);
    }
}

// KONEKSYON
async function handleLogin() {
    const email = document.getElementById('log-email').value;
    const pass = document.getElementById('log-pass').value;

    try {
        await auth.signInWithEmailAndPassword(email, pass);
        alert("Ou konekte!");
        // Redirije bò isit la
    } catch (err) {
        alert("Modpas oswa Email pa bon!");
    }
      }
          
