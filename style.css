import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. KONFIGIRASYON FIREBASE
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

// ==========================================
// 2. OTANTIFIKASYON (MARE AK WINDOW)
// ==========================================

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if(!email || !pass) return alert("Tanpri antre email ak modpas ou.");
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch(e) { alert("Erè: Email oswa Modpas pa bon!"); }
};

window.handleSignup = async () => {
    const name = document.getElementById('sign-name').value;
    const phone = document.getElementById('sign-phone').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    
    if(!name || !phone || !email || pass.length < 6) {
        return alert("Ranpli tout jaden yo. Modpas la dwe gen 6 karaktè oswa plis.");
    }

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await set(ref(db, `users/${res.user.uid}`), {
            name: name,
            phone: phone,
            email: email,
            balance: 0,
            ars_id: "ARS-" + Math.floor(1000 + Math.random() * 9000),
            date_kreyasyon: Date.now()
        });
        location.reload();
    } catch(e) { alert("Erè: " + e.message); }
};

window.handleLogout = () => signOut(auth).then(() => location.reload());

// ==========================================
// 3. LISTENERS REAL-TIME (DONE KLIYAN)
// ==========================================

onAuthStateChanged(auth, (user) => {
    if(user) {
        uID = user.uid;
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');

        // Rale done profil kliyan an
        onValue(ref(db, `users/${uID}`), (snap) => {
            userData = snap.val();
            if(userData) {
                document.getElementById('user-balance').innerText = userData.balance.toFixed(2);
                document.getElementById('side-name').innerText = userData.name;
                document.getElementById('side-id').innerText = userData.ars_id;
                document.getElementById('side-email').innerText = userData.email;
                document.getElementById('side-phone').innerText = userData.phone;
            }
        });

        listenToChat();
        loadTransactions();
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

// ==========================================
// 4. AKSYON ECHANJ AK RETRÈ
// ==========================================

window.openDialer = (provider) => {
    let amt = prompt("Konbe Gdes w ap voye?");
    if(!amt || isNaN(amt) || amt < 50) return alert("Minimòm echanj se 50 Gdes.");

    let code = (provider === 'digicel') 
        ? `*128*50947111123*${amt}#` 
        : `*123*88888888*32160708*${amt}#`;

    window.location.href = "tel:" + code.replace("#", "%23");

    // Sove tranzaksyon an kòm "An atant"
    push(ref(db, `transactions/${uID}`), {
        type: "Echanj " + provider.charAt(0).toUpperCase() + provider.slice(1),
        amount: amt,
        status: "An atant",
        date: Date.now()
    });
};

window.processRetre = async () => {
    const amount = parseFloat(document.getElementById('retre-amount').value);
    const rName = document.getElementById('retre-name').value;
    const rPhone = document.getElementById('retre-phone').value;
    const rMethod = document.getElementById('retre-method').value;

    if(!amount || amount < 100) return alert("Retrè minimòm se 100 Gdes.");
    if(amount > userData.balance) return alert("Balans ou pa ase.");
    if(!rName || !rPhone) return alert("Tanpri ranpli tout enfòmasyon retrè yo.");

    try {
        // Debite balans lan dabò
        await update(ref(db, `users/${uID}`), { balance: userData.balance - amount });

        // Voye tranzaksyon bay admin
        await push(ref(db, `transactions/${uID}`), {
            type: "Retrè",
            amount: amount,
            metod: rMethod,
            info: { non: rName, tel: rPhone },
            status: "An atant",
            date: Date.now()
        });

        alert("Demann retrè ou voye pafètman!");
        document.getElementById('retre-amount').value = "";
    } catch(e) { alert("Erè: " + e.message); }
};

// ==========================================
// 5. ISTORIK AK FILTRE (DATA CLASSIFICATION)
// ==========================================

function loadTransactions() {
    onValue(ref(db, `transactions/${uID}`), (snap) => {
        const list = document.getElementById('transaction-list');
        list.innerHTML = "";
        
        if(!snap.exists()) {
            list.innerHTML = `<p style="text-align:center; padding:20px; color:#94a3b8;">Poko gen tranzaksyon.</p>`;
            return;
        }

        snap.forEach(child => {
            const t = child.val();
            const div = document.createElement('div');
            div.className = "provider-card trans-item";
            div.setAttribute('data-type', t.type); // Enpòtan pou filtre a
            
            div.innerHTML = `
                <div>
                    <b>${t.type}</b><br>
                    <small style="color:#94a3b8;">${new Date(t.date).toLocaleDateString()}</small>
                </div>
                <div style="text-align:right;">
                    <b>${t.amount} G</b><br>
                    <span class="status-badge ${t.status === 'An atant' ? 'status-atant' : 'status-ok'}">${t.status}</span>
                </div>
            `;
            list.prepend(div);
        });
    });
}

window.filterData = (kategori, el) => {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');

    const items = document.querySelectorAll('.trans-item');
    items.forEach(item => {
        const tip = item.getAttribute('data-type');
        if(kategori === 'tout' || tip.includes(kategori)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
};

// ==========================================
// 6. CHAT SIPÒ
// ==========================================

window.sendMessage = async () => {
    const input = document.getElementById('chat-input-text');
    const msg = input.value.trim();
    if(!msg) return;

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
            box.innerHTML += `<div class="m-box ${m.sender === 'user' ? 'm-user' : 'm-admin'}">${m.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// 7. CAROUSEL AUTOMATIQUE
let currentSlide = 0;
setInterval(() => {
    currentSlide = (currentSlide + 1) % 2;
    const slider = document.getElementById('carousel-slider');
    if(slider) slider.style.transform = `translateX(-${currentSlide * 50}%)`;
}, 4000);
