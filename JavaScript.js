import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
  authDomain: "echanj-plus-778cd.firebaseapp.com",
  databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
  projectId: "echanj-plus-778cd",
  storageBucket: "echanj-plus-778cd.firebasestorage.app",
  messagingSenderId: "111144762929",
  appId: "1:111144762929:web:e64ce9a6da65781c289f10"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Chanje ant Login ak Register
window.toggleAuth = () => {
    const login = document.getElementById('login-form');
    const reg = document.getElementById('register-form');
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    reg.style.display = reg.style.display === 'none' ? 'block' : 'none';
};

// Enskripsyon
window.register = async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const seks = document.querySelector('input[name="seks"]:checked')?.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await set(ref(db, 'users/' + user.uid), {
            fullname: name,
            phone: phone,
            email: email,
            gender: seks,
            balance: 0
        });
        alert("Bwavo! Enskri avek siksè.");
    } catch (error) { alert(error.message); }
};

// Koneksyon
window.login = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Bienvenue sur Echanj plus! Ou sou platfom serye a.");
    } catch (error) { alert("Done yo pa kòrèk"); }
};

// Tcheke si moun nan konekte pou montre kontni an
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        // Koute balans lan an tan reyèl
        onValue(ref(db, 'users/' + user.uid + '/balance'), (snapshot) => {
            document.getElementById('user-balance').innerText = snapshot.val() || 0;
        });
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    }
});

// Lojik Echanj
let currentProvider = '';
window.openExchange = (provider) => {
    currentProvider = provider;
    document.getElementById('exchange-modal').style.display = 'block';
    document.getElementById('modal-title').innerText = "Vann Minit " + provider.toUpperCase();
};

document.getElementById('amount-to-sell').addEventListener('input', (e) => {
    const val = e.target.value;
    const net = val - (val * 0.165);
    document.getElementById('calc-preview').innerText = `W ap resevwa: ${net.toFixed(2)} Gdes`;
});

document.getElementById('btn-confirm-exchange').onclick = async () => {
    const qty = parseFloat(document.getElementById('amount-to-sell').value);
    const user = auth.currentUser;
    
    if(currentProvider === 'digicel' && (qty < 100 || qty > 1000)) return alert("Min 100, Max 1000");
    if(currentProvider === 'natcom' && (qty < 100 || qty > 500)) return alert("Min 100, Max 500");

    const confirmMsg = currentProvider === 'digicel' 
        ? "le'w finn voye 1er kod la bouton Apel telefon lan , konpoze *128*1# pou'w konfime transaction. Èske ou vle kontinye?"
        : "eske ou vle vann minit Natcom ou?";

    if(confirm(confirmMsg)) {
        const netAmount = qty - (qty * 0.165);
        // Mizajou Balans Firebase
        const snapshot = await get(ref(db, `users/${user.uid}/balance`));
        const currentBal = snapshot.val() || 0;
        await update(ref(db, `users/${user.uid}`), { balance: currentBal + netAmount });

        // Louvri Dialer
        let code = currentProvider === 'digicel' 
            ? `tel:*128*50947111123*${qty}%23` 
            : `tel:*123*88888888*32160708*${qty}%23`;
        window.location.href = code;
    }
};

// Retrè
window.processWithdrawal = async () => {
    const user = auth.currentUser;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = document.querySelector('input[name="metod"]:checked')?.value;
    const name = document.getElementById('withdraw-name').value;

    const snapshot = await get(ref(db, `users/${user.uid}/balance`));
    const currentBal = snapshot.val() || 0;

    if(amount > currentBal) return alert("Balans ou pa ase");
    if(amount < 83.5) return alert("Retrè minimòm se 83.5");

    // Diminye balans
    await update(ref(db, `users/${user.uid}`), { balance: currentBal - amount });

    // Voye sou WhatsApp
    const msg = `💸 *DEMANN RETRÈ*%0A👤 Non: ${name}%0A💰 Kantite: ${amount}G%0A🏦 Metòd: ${method}`;
    window.location.href = `https://wa.me/50947111123?text=${msg}`;
};

window.logout = () => signOut(auth);
window.showSection = (id) => {
    document.getElementById('echanj-section').style.display = id === 'echanj' ? 'block' : 'none';
    document.getElementById('retre-section').style.display = id === 'retre' ? 'block' : 'none';
};
window.closeModal = () => document.getElementById('exchange-modal').style.display = 'none';
