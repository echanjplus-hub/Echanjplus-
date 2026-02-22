import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// KONFIGIRASYON FIREBASE
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
let uID, userData;

// AUTH FUNCTIONS
window.toggleAuth = (mode) => {
    document.getElementById('login-section').classList.toggle('hidden', mode === 'signup');
    document.getElementById('signup-section').classList.toggle('hidden', mode === 'login');
};

window.handleSignup = async () => {
    const name = document.getElementById('sign-name').value;
    const phone = document.getElementById('sign-phone').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    if(!name || !email || !pass) return alert("Ranpli tout jaden yo");
    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await set(ref(db, `users/${res.user.uid}`), {
            name, phone, email, balance: 0, ars_id: "ARS-"+Math.floor(1000+Math.random()*9000)
        });
        location.reload();
    } catch(e) { alert(e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } catch(e) { alert("Erè: " + e.message); }
};

window.handleLogout = () => signOut(auth).then(() => location.reload());

// NAVIGATION UI
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('active');
window.toggleChat = () => document.getElementById('user-chat-box').classList.toggle('chat-closed');
window.showAbout = () => { document.getElementById('modal-about').classList.remove('hidden'); toggleSidebar(); };
window.closeAbout = () => document.getElementById('modal-about').classList.add('hidden');

window.showPage = (id, el) => {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
    if(document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
};

// ACTIONS
window.openDialer = (provider) => {
    let amount = prompt("Konbe Gdes w ap voye?");
    if(!amount || amount < 50) return alert("Minimòm 50G");
    let code = provider === 'digicel' ? `*128*50947111123*${amount}#` : `*123*88888888*32160708*${amount}#`;
    window.location.href = "tel:" + code.replace("#", "%23");
    push(ref(db, `transactions/${uID}`), { type: "Echanj "+provider, amount, status: "An atant", date: Date.now() });
};

window.processRetre = async () => {
    const amount = parseFloat(document.getElementById('retre-amount').value);
    const phone = document.getElementById('retre-phone').value;
    if(!amount || amount < 100 || amount > userData.balance) return alert("Balans ensifizan!");
    await update(ref(db, `users/${uID}`), { balance: userData.balance - amount });
    push(ref(db, `transactions/${uID}`), { type: "Retrè", amount, status: "An atant", date: Date.now() });
    alert("Demann voye!");
};

// REALTIME LISTENERS
onAuthStateChanged(auth, (user) => {
    if(user) {
        uID = user.uid;
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        onValue(ref(db, `users/${uID}`), (snap) => {
            userData = snap.val();
            document.getElementById('user-balance').innerText = userData.balance.toFixed(2);
            document.getElementById('side-name').innerText = userData.name;
            document.getElementById('side-id').innerText = userData.ars_id;
            document.getElementById('side-email').innerText = userData.email;
            document.getElementById('side-phone').innerText = userData.phone;
        });
        listenChat();
        loadTrans();
    }
});

// CHAT
window.sendMessage = () => {
    const txt = document.getElementById('chat-input-text').value;
    if(!txt) return;
    push(ref(db, `chats/${uID}`), { sender: 'user', text: txt });
    document.getElementById('chat-input-text').value = "";
};

function listenChat() {
    onValue(ref(db, `chats/${uID}`), (snap) => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = "";
        snap.forEach(c => {
            const m = c.val();
            box.innerHTML += `<div class="m-box ${m.sender==='user'?'m-user':'m-admin'}">${m.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// ISTORIK & FILTRE
function loadTrans() {
    onValue(ref(db, `transactions/${uID}`), (snap) => {
        const list = document.getElementById('transaction-list');
        list.innerHTML = "";
        snap.forEach(c => {
            const t = c.val();
            list.innerHTML = `<div class="provider-card" data-type="${t.type}"><div><b>${t.type}</b><br><small>${t.status}</small></div><b>${t.amount} G</b></div>` + list.innerHTML;
        });
    });
}

window.filterTrans = (cat, el) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('#transaction-list .provider-card').forEach(item => {
        if(cat === 'tout') item.style.display = 'flex';
        else item.style.display = item.getAttribute('data-type').includes(cat) ? 'flex' : 'none';
    });
};

// CAROUSEL
let idx = 0;
setInterval(() => {
    idx = (idx + 1) % 2;
    const s = document.getElementById('carousel-slider');
    if(s) s.style.transform = `translateX(-${idx * 50}%)`;
}, 3000);
