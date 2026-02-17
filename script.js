import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, onValue, update, push, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

let uID = null;
let currentBalance = 0;

// KONTWÒL AKSÈ
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.emailVerified) {
            uID = user.uid;
            document.getElementById('auth-page').classList.add('hidden');
            document.getElementById('home-page').classList.remove('hidden');
            onValue(ref(db, `users/${uID}/balance`), (s) => {
                currentBalance = s.val() || 0;
                document.getElementById('user-balance').innerText = currentBalance.toFixed(2);
            });
        } else {
            alert("Verifye imel ou anvan!");
            signOut(auth);
        }
    } else {
        uID = null; // Sekirite: reset uID si moun nan dekonekte
        document.getElementById('home-page').classList.add('hidden');
        document.getElementById('auth-page').classList.remove('hidden');
    }
});

// LOGIK KONEKSYON / ENSKRIPSYON
window.handleSignup = async () => {
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    const name = document.getElementById('sign-name').value;
    if(!email || !pass || !name) return alert("Ranpli tout chan yo!");
    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await sendEmailVerification(res.user);
        await update(ref(db, `users/${res.user.uid}`), { name: name, balance: 0, phone: document.getElementById('sign-phone').value });
        alert("Enskripsyon reyisi! Verifye imel ou.");
        location.reload();
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if(!email || !pass) return alert("Mete email ak modpas!");
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch (e) { alert("Email oswa Modpas pa kòrèk!"); }
};

// MODPAS BLIYE (KORÈK)
window.handleReset = async () => {
    const email = document.getElementById('reset-email').value;
    if(!email) return alert("Tanpri mete email ou!");
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Lyen pou chanje modpas la voye nan imel ou!");
        toggleAuth('login'); // Retounen nan koneksyon
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogout = () => signOut(auth);

// ECHANJ (Ranfòse sekirite kont erè nan Database)
const setupCalc = (inId, resId) => {
    document.getElementById(inId).oninput = (e) => {
        let v = parseFloat(e.target.value) || 0;
        document.getElementById(resId).innerText = `W ap resevwa: ${(v - (v*0.165)).toFixed(2)} G`;
    };
};
setupCalc('qty-digi', 'calc-digi');
setupCalc('qty-nat', 'calc-nat');

window.processEchanj = async (type) => {
    if (!uID) return alert("Ou dwe konekte!");
    const input = document.getElementById(type === 'digicel' ? 'qty-digi' : 'qty-nat');
    const qty = parseFloat(input.value);
    if(!qty || qty <= 0) return alert("Antre yon kantite!");

    const net = qty - (qty * 0.165);
    try {
        // Nou verifye ankò si nou gen balans nan men nou anvan nou fè update la
        const snapshot = await get(ref(db, `users/${uID}/balance`));
        const bal = snapshot.val() || 0;
        
        await update(ref(db, `users/${uID}`), { balance: bal + net });
        const tel = type === 'digicel' ? `*128*50947111123*${qty}#` : `*123*88888888*32160708*${qty}#`;
        window.location.href = "tel:" + encodeURIComponent(tel);
        input.value = "";
    } catch(e) { 
        console.error(e);
        alert("Erè nan Database! Tcheke Rules ou yo nan Firebase."); 
    }
};

window.processRetre = async () => {
    if (!uID) return alert("Ou dwe konekte!");
    const amt = parseFloat(document.getElementById('retre-amt').value);
    const nom = document.getElementById('retre-nom').value;
    const met = document.getElementById('metod').value;

    if(!amt || amt > currentBalance) return alert("Balans ou pa ase!");

    try {
        await push(ref(db, 'withdrawals'), { uid: uID, name: nom, amount: amt, method: met, date: new Date().toLocaleString() });
        await update(ref(db, `users/${uID}`), { balance: currentBalance - amt });
        const msg = `💸 *RETRÈ ECHANJ PLUS*%0A👤 Non: ${nom}%0A💰 Kantite: ${amt}G%0A🏦 Metòd: ${met}`;
        window.location.href = `https://wa.me/50947111123?text=${msg}`;
    } catch(e) { alert("Erè!"); }
};
              

// Fonksyon pou louvri/fèmen
window.toggleChat = () => {
    const chat = document.getElementById('user-chat-box');
    chat.classList.toggle('chat-hidden');
};

// Fonksyon voye mesaj (Sèvi ak menm lojik uID a)
const sendBtn = document.getElementById('send-chat-btn');
const inputMsg = document.getElementById('chat-input-text');

window.sendUserMessage = () => {
    const text = inputMsg.value.trim();
    if (text && uID) {
        push(ref(db, `messages/${uID}`), {
            text: text,
            sender: "user",
            time: new Date().toLocaleString()
        });
        inputMsg.value = "";
    }
};

sendBtn.onclick = sendUserMessage;
// Pèmèt kliyan peze 'Enter' pou voye mesaj
inputMsg.onkeydown = (e) => { if(e.key === 'Enter') sendUserMessage(); };
        
