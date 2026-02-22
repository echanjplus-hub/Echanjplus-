import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, set, get, update, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. KONFIGIRASYON FIREBASE OU AN
const firebaseConfig = {
  apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
  authDomain: "echanj-plus-778cd.firebaseapp.com",
  databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
  projectId: "echanj-plus-778cd",
  storageBucket: "echanj-plus-778cd.firebasestorage.app",
  messagingSenderId: "111144762929",
  appId: "1:111144762929:web:e64ce9a6da65781c289f10",
  measurementId: "G-J1BQRF32ZW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let uID, userData;

// ============================================================
// 2. OTANTIFIKASYON (LOGIN / SIGNUP)
// ============================================================

window.handleSignup = async () => {
    const name = document.getElementById('sign-name').value;
    const phone = document.getElementById('sign-phone').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    const refCode = document.getElementById('sign-ref').value.trim();

    if (!name || !phone || !email || pass.length < 6) {
        alert("Silvouplè ranpli tout jaden yo. Modpas dwe gen omwen 6 karaktè.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        await set(ref(db, `users/${user.uid}`), {
            name: name,
            phone: phone,
            email: email,
            balance: 0,
            referredBy: refCode || null,
            isFirstWithdrawal: true,
            ars_id: "ARS-" + Math.floor(1000 + Math.random() * 9000),
            createdAt: Date.now()
        });
        location.reload();
    } catch (e) { alert("Erè nan enskripsyon: " + e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) { alert("Email oswa Modpas pa kòrèk!"); }
};

window.handleLogout = () => signOut(auth).then(() => location.reload());

// ============================================================
// 3. KONTWÒL ETA ITILIZATÈ (REAL-TIME)
// ============================================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        uID = user.uid;
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        
        onValue(ref(db, `users/${uID}`), (snap) => {
            userData = snap.val();
            updateUI();
        });
        
        listenToChat();
        loadTransactions();
        startCarousel();
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

function updateUI() {
    if (!userData) return;
    const bal = parseFloat(userData.balance).toFixed(2);
    document.getElementById('user-balance').innerText = bal;
    document.getElementById('retre-mini-balance').innerText = bal;
    document.getElementById('side-name').innerText = userData.name;
    document.getElementById('top-id-badge').innerText = userData.ars_id;
    document.getElementById('user-id-display').innerText = userData.ars_id;
}

// ============================================================
// 4. ECHANJ & DIALER (USSD LOGIC)
// ============================================================

window.processEchanj = async (provider) => {
    const inputId = provider === 'digicel' ? 'qty-digi' : 'qty-nat';
    const amount = parseFloat(document.getElementById(inputId).value);

    if (!amount || amount < 50) return alert("Minimòm echanj se 50 Gdes");

    let ussdCode = (provider === 'digicel') 
        ? `*128*50947111123*${amount}#` 
        : `*123*88888888*32160708*${amount}#`;

    window.location.href = "tel:" + ussdCode.replace('#', '%23');

    const net = amount - (amount * 0.165);
    const log = {
        type: `Echanj ${provider.toUpperCase()}`,
        amount: amount,
        received: net,
        status: "An Atant",
        date: Date.now()
    };
    
    await push(ref(db, `transactions/${uID}`), log);
    await push(ref(db, `admin_exchanges`), { ...log, userName: userData.name, userPhone: userData.phone, uid: uID });
    
    alert("Dialer a ouvri. Apre w fin peye, balans ou ap aktive apre verifikasyon.");
};

// ============================================================
// 5. RETRÈ PRO (AVÈK MESAJ KONFYANS)
// ============================================================

window.processRetre = async () => {
    const amount = parseFloat(document.getElementById('retre-amount').value);
    const name = document.getElementById('retre-name').value;
    const phone = document.getElementById('retre-phone').value;
    const method = document.getElementById('retre-method').value;

    if (!amount || amount < 100) return alert("Minimòm retrè se 100 Gdes");
    if (!name || !phone) return alert("Ranpli tout jaden yo!");
    if (amount > userData.balance) return alert("Balans ou pa ase!");

    try {
        await update(ref(db, `users/${uID}`), { balance: userData.balance - amount });

        const retreData = {
            type: `Retrè ${method}`,
            amount: amount,
            status: "An atant",
            info: { non: name, tel: phone },
            date: Date.now()
        };

        await push(ref(db, `transactions/${uID}`), retreData);
        await push(ref(db, `admin_withdrawals`), { ...retreData, uid: uID });

        showSuccessModal();
    } catch (e) { alert("Gen yon erè: " + e.message); }
};

function showSuccessModal() {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div class="success-card">
            <div class="check-icon"><i class="fa fa-check"></i></div>
            <h2>Demann Resevwa!</h2>
            <p>Nou pran demann ou an ak anpil swen, wap jwenn li apre verifikasyon nou an. Mèsi!</p>
            <button onclick="this.parentElement.parentElement.remove()" class="btn-primary-pro" style="padding:10px 20px; background:#0062ff; color:white; border:none; border-radius:10px; cursor:pointer;">OK, DAKÒ</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ============================================================
// 6. CHAT MESSENGER PRO (A, B, C)
// ============================================================

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
    const chatBody = document.getElementById('chat-messages');
    onValue(ref(db, `chats/${uID}`), (snap) => {
        chatBody.innerHTML = "";
        snap.forEach(child => {
            const m = child.val();
            const div = document.createElement('div');
            div.className = `m-box ${m.sender === 'user' ? 'm-user' : 'm-admin'}`;
            div.innerText = m.text;
            chatBody.appendChild(div);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    });
}

// ============================================================
// 7. ISTORIK & FILTRE
// ============================================================

function loadTransactions() {
    const list = document.getElementById('transaction-list');
    onValue(ref(db, `transactions/${uID}`), (snap) => {
        list.innerHTML = "";
        if (!snap.exists()) return list.innerHTML = "<p style='text-align:center; padding:20px; color:#999;'>Poko gen tranzaksyon.</p>";
        
        snap.forEach(child => {
            const t = child.val();
            const isRetre = t.type.includes("Retrè");
            const div = document.createElement('div');
            div.className = `trans-item ${isRetre ? 'type-retre' : 'type-echanj'}`;
            div.style.display = 'flex'; // Pou asire l parèt
            div.innerHTML = `
                <div class="provider-info">
                    <span class="provider-name" style="font-weight:800; display:block;">${t.type}</span>
                    <small style="color:#94a3b8; font-size:11px;">${new Date(t.date).toLocaleDateString()}</small>
                </div>
                <div style="text-align:right">
                    <span style="font-weight:900; color:${isRetre ? '#ef4444' : '#00c853'}">
                        ${isRetre ? '-' : '+'}${t.amount} G
                    </span>
                    <br><small style="font-size:10px; font-weight:700; color:#666;">${t.status}</small>
                </div>
            `;
            list.prepend(div);
        });
    });
}

window.filterTrans = (category, element) => {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    const items = document.querySelectorAll('.trans-item');
    items.forEach(item => {
        const typeText = item.querySelector('.provider-name').innerText;
        if (category === 'tout') {
            item.style.display = 'flex';
        } else if (typeText.includes(category)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
};

// ============================================================
// 8. UTILS (CAROUSEL & SHARE)
// ============================================================

function startCarousel() {
    let index = 0;
    const slider = document.getElementById('carousel-slider');
    if(!slider) return;
    setInterval(() => {
        index = (index + 1) % 2;
        slider.style.transform = `translateX(-${index * 100}%)`;
    }, 4000);
}

window.shareReferral = () => {
    const text = `Antre sou Echanj Plus, chanje minit an kòb kach! Kòd mwen: ${userData.ars_id}`;
    if (navigator.share) {
        navigator.share({ title: 'Echanj Plus', text: text, url: 'https://echanjplus.com' });
    } else {
        alert("Kopye kòd ARS ou: " + userData.ars_id);
    }
};
