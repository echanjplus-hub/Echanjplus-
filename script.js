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


// --- KÒD CHAT KLIYAN KORİJE ---
const launcher = document.getElementById('chat-launcher');
const chatBox = document.getElementById('user-chat-box');
const sendBtn = document.getElementById('send-chat-btn');
const inputMsg = document.getElementById('chat-input-text');
const messagesDiv = document.getElementById('chat-messages');

// Fonksyon pou louvri/fèmen
window.toggleChat = () => {
    chatBox.classList.toggle('chat-hidden');
};

// VOYE MESAJ NAN DATABASE
window.sendUserMessage = () => {
    const text = inputMsg.value.trim();
    
    // N ap tcheke si uID egziste anvan nou voye
    if (text !== "" && uID) {
        const msgRef = ref(db, `messages/${uID}`); // Sa a konekte ak messages/uID nan Firebase
        push(msgRef, {
            text: text,
            sender: "user",
            time: new Date().toLocaleString()
        }).then(() => {
            inputMsg.value = ""; // Vide bwat la apre mesaj la fin voye
        }).catch((error) => {
            console.error("Erè voye mesaj:", error);
        });
    } else if (!uID) {
        alert("Ou dwe konekte pou w ka ekri!");
    }
};

// KOUTE MESAJ YO (LIVE)
function listenToChat(userId) {
    const chatRef = ref(db, `messages/${userId}`);
    onValue(chatRef, (snap) => {
        messagesDiv.innerHTML = "";
        snap.forEach((child) => {
            const m = child.val();
            const div = document.createElement('div');
            div.className = `m-box ${m.sender === 'user' ? 'm-user' : 'm-admin'}`;
            div.innerText = m.text;
            messagesDiv.appendChild(div);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Toujou desann anba
    });
}

// EVÈNMAN YO
sendBtn.onclick = sendUserMessage;
inputMsg.onkeydown = (e) => { if(e.key === 'Enter') sendUserMessage(); };

// ENTEGRASYON NAN AUTH LA (Trè enpòtan)
onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
        uID = user.uid; // Nou asire uID a gen valè
        
        // Limen chat la kounye a
        if(launcher) launcher.style.display = "flex";
        listenToChat(uID); // Kòmanse koute mesaj pou UID sa a
        
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
    } else {
        uID = null;
        if(launcher) launcher.style.display = "none";
        document.getElementById('home-page').classList.add('hidden');
        document.getElementById('auth-page').classList.remove('hidden');
    }
});
                 


        // Fonksyon Karousel Otomatik
function startCarousel() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    // Chanje chak 8 segond (8000ms)
    setInterval(nextSlide, 8000);
}

// Rele fonksyon an lè paj la chaje
document.addEventListener('DOMContentLoaded', startCarousel);
            


       //fonksyon rezo sosyo yo 
onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
        // Debloke Carrousel la
        document.getElementById('carousel-section').classList.remove('hidden');
        startCarousel();

        // DEBLOKE REZO SOSYO YO ISIT LA
        document.getElementById('social-section').classList.remove('hidden');

    } else {
        // Kache yo si moun nan dekonekte
        document.getElementById('carousel-section').classList.add('hidden');
        document.getElementById('social-section').classList.add('hidden');
    }
});
    
        
