import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, onValue, update, get, push, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. KONFIGIRASYON FIREBASE
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

let uID = null;
let userData = null;

// ================= 2. KONTWÒL AKSÈ & DETEKSYON PWOFIL =================
onAuthStateChanged(auth, async (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');
    const profileModal = document.getElementById('profile-modal');
    const chatLauncher = document.getElementById('chat-launcher');

    if (user) {
        if (user.emailVerified) {
            uID = user.uid;
            
            // Tcheke si non ak telefòn egziste nan Firebase
            const userRef = ref(db, `users/${uID}`);
            const snapshot = await get(userRef);
            const data = snapshot.val();

            if (!data || !data.name || !data.phone) {
                // Si done manke, montre modal pwofil la obligatwa
                authPage.classList.add('hidden');
                homePage.classList.remove('hidden'); 
                profileModal.classList.remove('hidden'); 
            } else {
                // Si tout bagay ok, antre nan sistèm nan
                userData = data;
                profileModal.classList.add('hidden');
                authPage.classList.add('hidden');
                homePage.classList.remove('hidden');
                chatLauncher.classList.remove('hidden');
                startDashboard();
                listenToChat();
            }
        } else {
            alert("Tanpri verifye imel ou anvan ou konekte!");
            signOut(auth);
        }
    } else {
        // Si li pa konekte
        homePage.classList.add('hidden');
        authPage.classList.remove('hidden');
        profileModal.classList.add('hidden');
        chatLauncher.classList.add('hidden');
    }
});

// ================= 3. SOVE PWOFIL KI TE MANKE (MODAL) =================
window.updateMissingProfile = async () => {
    const newName = document.getElementById('update-name').value.trim();
    const newPhone = document.getElementById('update-phone').value.trim();

    if (newName.length < 3 || newPhone.length < 8) {
        return alert("Tanpri ranpli non ak nimewo telefòn lan kòrèkteman!");
    }

    try {
        const myCode = "EP-" + Math.floor(1000 + Math.random() * 9000);
        await update(ref(db, `users/${uID}`), {
            name: newName,
            phone: newPhone,
            myReferralCode: myCode,
            balance: 0,
            email: auth.currentUser.email
        });
        alert("Enfòmasyon sove!");
        location.reload(); 
    } catch (e) { alert("Erè: " + e.message); }
};

// ================= 4. AUTH: LOGIN & SIGNUP =================
window.handleSignup = async () => {
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value.trim();
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const refCode = document.getElementById('sign-ref').value.trim();

    if (!email || !pass || !name || !phone) return alert("Tout chan yo obligatwa!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await sendEmailVerification(res.user);
        const myCode = "EP-" + Math.floor(1000 + Math.random() * 9000);

        await update(ref(db, `users/${res.user.uid}`), {
            name: name,
            phone: phone,
            email: email,
            balance: 0,
            referredBy: refCode || "pajenn",
            myReferralCode: myCode
        });
        alert("Enskripsyon reyisi! Verifye imel ou.");
        location.reload();
    } catch (e) { alert(e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch (e) { alert("Email oswa Modpas pa kòrèk!"); }
};

// ================= 5. DASHBOARD & TRANSAKSYON =================
function startDashboard() {
    onValue(ref(db, `users/${uID}`), (snapshot) => {
        const d = snapshot.val();
        if (!d) return;
        userData = d;
        document.getElementById('side-name').innerText = d.name;
        document.getElementById('side-phone').innerText = d.phone;
        document.getElementById('side-email').innerText = d.email;
        document.getElementById('user-balance').innerText = d.balance.toFixed(2);
        document.getElementById('side-balance').innerText = d.balance.toFixed(2);
        
        const year = new Date().getFullYear();
        const arsID = `ARS-${d.name.split(' ')[0].toUpperCase()}-${year}`;
        document.getElementById('user-id-display').innerText = `ID: ${arsID}`;
    });
    loadTransactions();
}

window.processEchanj = async (type) => {
    const input = document.getElementById(type === 'digicel' ? 'qty-digi' : 'qty-nat');
    const qty = parseFloat(input.value);
    if (!qty || qty <= 0) return alert("Mete yon kantite!");

    const transSnap = await get(ref(db, `transactions/${uID}`));
    const fee = transSnap.exists() ? 0.165 : 0.135; // 13.5% si se premye fwa
    const net = qty - (qty * fee);

    try {
        await update(ref(db, `users/${uID}`), { balance: userData.balance + net });
        await push(ref(db, `transactions/${uID}`), { tip: type, kantite: qty, resevwa: net, dat: new Date().toLocaleString() });
        
        // Komisyon Parenn (4.5%)
        if (userData.referredBy && userData.referredBy !== "pajenn") {
            const q = query(ref(db, 'users'), orderByChild('myReferralCode'), equalTo(userData.referredBy));
            const pSnap = await get(q);
            if (pSnap.exists()) {
                const pID = Object.keys(pSnap.val())[0];
                const pData = Object.values(pSnap.val())[0];
                await update(ref(db, `users/${pID}`), { balance: pData.balance + (qty * 0.045) });
            }
        }
        alert("Echanj reyisi!");
        input.value = "";
    } catch (e) { alert("Erè!"); }
};

window.processRetre = async () => {
    const amt = parseFloat(document.getElementById('retre-amt').value);
    const tel = document.getElementById('retre-phone').value;
    const nom = document.getElementById('retre-nom').value;
    const met = document.getElementById('metod').value;

    if (!amt || amt > userData.balance) return alert("Balans ou pa ase!");

    await push(ref(db, 'withdrawals'), { uid: uID, non: nom, tel: tel, montan: amt, metod: met, status: "Ankou", dat: new Date().toLocaleString() });
    await update(ref(db, `users/${uID}`), { balance: userData.balance - amt });
    alert("Retrè anrejistre!");
};

function loadTransactions() {
    onValue(ref(db, `transactions/${uID}`), (s) => {
        const list = document.getElementById('transaction-list');
        list.innerHTML = s.exists() ? "" : "<p>Okenn tranzaksyon.</p>";
        if (s.exists()) {
            Object.values(s.val()).reverse().forEach(t => {
                list.innerHTML += `<div class="box" style="font-size:12px;"><b>${t.tip}</b>: ${t.kantite}G <br> <span class="green">+${t.resevwa.toFixed(2)}G</span></div>`;
            });
        }
    });
}

// ================= 6. CHAT SISTÈM (STAB) =================
function listenToChat() {
    onValue(ref(db, `chats/${uID}`), (snapshot) => {
        const msgBox = document.getElementById('chat-messages');
        msgBox.innerHTML = "";
        if (snapshot.exists()) {
            Object.values(snapshot.val()).forEach(m => {
                const c = m.sender === "user" ? "m-user" : "m-admin";
                msgBox.innerHTML += `<div class="m-box ${c}">${m.text}</div>`;
            });
            msgBox.scrollTop = msgBox.scrollHeight; // Toujou desann anba
        }
    });
}

document.getElementById('send-chat-btn').onclick = async () => {
    const txt = document.getElementById('chat-input-text');
    if (!txt.value.trim()) return;
    await push(ref(db, `chats/${uID}`), { sender: "user", text: txt.value, dat: new Date().getTime() });
    txt.value = "";
};

// ================= 7. LÒT FONKSYON =================
window.handleLogout = () => signOut(auth);
window.handleReset = () => {
    sendPasswordResetEmail(auth, userData.email).then(() => alert("Imel voye!"));
};

// Kalkil Vizyèl
document.getElementById('qty-digi').oninput = (e) => {
    let v = parseFloat(e.target.value) || 0;
    document.getElementById('calc-digi').innerText = `Resevwa: ${(v - (v * 0.165)).toFixed(2)} G`;
};
                    
