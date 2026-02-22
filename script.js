// Enpòte fonksyon Firebase yo
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// KONFIGIRASYON FIREBASE OU AN
const firebaseConfig = {
    apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
    authDomain: "echanj-plus-778cd.firebaseapp.com",
    databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
    projectId: "echanj-plus-778cd",
    storageBucket: "echanj-plus-778cd.firebasestorage.app",
    messagingSenderId: "111144762929",
    appId: "1:111144762929:web:e64ce9a6da65781c289f10"
};

// Inisyalize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let uID, userData;

// ==========================================
// 1. OTANTIFIKASYON (LOGIN / SIGNUP)
// ==========================================

window.handleSignup = async () => {
    const name = document.getElementById('sign-name').value;
    const phone = document.getElementById('sign-phone').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;

    if (!name || !phone || !email || pass.length < 6) return alert("Ranpli tout jaden yo byen (Modpas 6 karaktè min)");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        // Kreye pwofil nan Database
        await set(ref(db, `users/${res.user.uid}`), {
            name: name,
            phone: phone,
            email: email,
            balance: 0,
            ars_id: "ARS-" + Math.floor(1000 + Math.random() * 9000),
            createdAt: serverTimestamp()
        });
        location.reload();
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) { alert("Email oswa Modpas pa bon!"); }
};

window.handleLogout = () => signOut(auth).then(() => location.reload());

// ==========================================
// 2. KONTWÒL ETA ITILIZATÈ (REAL-TIME)
// ==========================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        uID = user.uid;
        // Kache paj login, montre home
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        
        // Rale done itilizatè a an tan reyèl
        onValue(ref(db, `users/${uID}`), (snap) => {
            userData = snap.val();
            updateUI();
        });

        listenToChat();
        loadTransactions();
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

function updateUI() {
    if (!userData) return;
    // Mizajou Sidebar ak Dashboard
    document.getElementById('user-balance').innerText = userData.balance.toFixed(2);
    document.getElementById('side-name').innerText = userData.name;
    document.getElementById('side-id').innerText = userData.ars_id;
    document.getElementById('side-email').innerText = userData.email;
    document.getElementById('side-phone').innerText = userData.phone;
}

// ==========================================
// 3. ECHANJ & DIALER
// ==========================================

window.openDialer = (provider) => {
    let amount = prompt("Konbe Gdes w ap voye?");
    if (!amount || amount < 50) return alert("Minimòm se 50 Gdes");

    let code = (provider === 'digicel') 
        ? `*128*50947111123*${amount}#` 
        : `*123*88888888*32160708*${amount}#`;

    window.location.href = "tel:" + code.replace("#", "%23");

    // Sove demann lan nan istorik
    push(ref(db, `transactions/${uID}`), {
        type: "Echanj " + provider.toUpperCase(),
        amount: amount,
        status: "An atant",
        date: Date.now()
    });
};

// ==========================================
// 4. RETRÈ
// ==========================================

window.processRetre = async () => {
    const amount = parseFloat(document.getElementById('retre-amount').value);
    const name = document.getElementById('retre-name').value;
    const phone = document.getElementById('retre-phone').value;

    if (!amount || amount < 100) return alert("Minimòm retrè se 100 Gdes");
    if (amount > userData.balance) return alert("Balans ou pa ase!");

    try {
        // Debite balans lan
        await update(ref(db, `users/${uID}`), { balance: userData.balance - amount });

        // Voye bay admin
        await push(ref(db, `transactions/${uID}`), {
            type: "Retrè",
            amount: amount,
            info: { non: name, tel: phone },
            status: "An atant",
            date: Date.now()
        });

        alert("Demann retrè ou resevwa!");
    } catch (e) { alert(e.message); }
};

// ==========================================
// 5. CHAT MESSENGER
// ==========================================

window.sendMessage = async () => {
    const input = document.getElementById('chat-input-text');
    const msg = input.value.trim();
    if (!msg) return;

    await push(ref(db, `chats/${uID}`), {
        sender: 'user',
        text: msg,
        timestamp: serverTimestamp()
    });
    input.value = "";
};

function listenToChat() {
    onValue(ref(db, `chats/${uID}`), (snap) => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = "";
        snap.forEach(child => {
            const m = child.val();
            const div = document.createElement('div');
            div.className = `m-box ${m.sender === 'user' ? 'm-user' : 'm-admin'}`;
            div.innerText = m.text;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
}

// ==========================================
// 6. ISTORIK & FILTRE
// ==========================================

function loadTransactions() {
    onValue(ref(db, `transactions/${uID}`), (snap) => {
        const list = document.getElementById('transaction-list');
        list.innerHTML = "";
        if (!snap.exists()) return list.innerHTML = "<p style='text-align:center; padding:10px;'>Poko gen tranzaksyon.</p>";

        snap.forEach(child => {
            const t = child.val();
            const div = document.createElement('div');
            div.className = "provider-card";
            div.setAttribute('data-type', t.type);
            div.innerHTML = `
                <div><b>${t.type}</b><br><small>${new Date(t.date).toLocaleDateString()}</small></div>
                <div style="text-align:right"><b>${t.amount} G</b><br><small>${t.status}</small></div>
            `;
            list.prepend(div);
        });
    });
}

window.filterTrans = (cat, el) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('#transaction-list .provider-card').forEach(item => {
        if (cat === 'tout') item.style.display = 'flex';
        else item.style.display = item.getAttribute('data-type').includes(cat) ? 'flex' : 'none';
    });
};
