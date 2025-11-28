let provider, signer, contract;

// --- 1. INITIALISATION & TIMER ---
window.onload = () => {
    // Vérif config
    if (typeof CONTRACT_ADDRESS === 'undefined') {
        alert("Erreur: config.js manquant !"); return;
    }
    // Thème
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeBtnText(savedTheme);

    // Timer Pro
    let countdown = 2; 
    const loadingText = document.getElementById('loading-text');
    const interval = setInterval(() => {
        countdown--;
        if(loadingText) loadingText.innerText = `Chargement système...`;
        if (countdown <= 0) {
            clearInterval(interval);
            endLoading();
        }
    }, 1000);
};

function endLoading() {
    document.getElementById('loader-overlay').style.display = 'none';
    document.getElementById('app-content').classList.remove('hidden');
}

// --- 2. LOGIQUE UTILISATEUR (OUI/NON) ---
function userHasMetaMask(hasWallet) {
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('connect-section').classList.remove('hidden');

    if (hasWallet) {
        // L'utilisateur dit OUI
        checkMetaMaskAvailable();
    } else {
        // L'utilisateur dit NON -> Lien de téléchargement
        document.getElementById('download-block').classList.remove('hidden');
    }
}

function checkMetaMaskAvailable() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (window.ethereum) {
        // MetaMask est vraiment là
        document.getElementById('connect-block').classList.remove('hidden');
        
        // Auto-connexion si déjà autorisé
        window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
            if (accounts.length > 0) connectWallet();
        });
    } else {
        // Il a dit OUI mais on ne détecte rien
        if (isMobile) {
            // Sur mobile, on propose le Deep Link
            document.getElementById('connect-block').classList.remove('hidden');
            document.getElementById('connectBtn').classList.add('hidden'); // Cacher bouton PC
            document.getElementById('mobile-deep-link').classList.remove('hidden'); // Montrer bouton Mobile

            const currentUrl = window.location.href.replace("https://", "");
            const deepLink = `https://metamask.app.link/dapp/${currentUrl}`;
            document.getElementById('mobileBtn').onclick = () => window.location.href = deepLink;
        } else {
            // Sur PC, il a menti ou c'est désactivé -> On le renvoie au téléchargement
            alert("MetaMask non détecté sur ce navigateur.");
            document.getElementById('download-block').classList.remove('hidden');
        }
    }
}

// --- 3. CONNEXION ---
document.getElementById('connectBtn').addEventListener('click', connectWallet);

async function connectWallet() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Force Sepolia
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
             try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }],
                });
            } catch (e) { alert("Changez le réseau vers Sepolia !"); return; }
        }
        initApp();
    } catch (err) { console.error(err); }
}

async function initApp() {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    document.getElementById('connect-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadStudents();
}

// --- 4. AJOUT ÉTUDIANT ---
async function addStudent() {
    const fName = document.getElementById('fName').value;
    const lName = document.getElementById('lName').value;
    const dob = document.getElementById('dob').value;
    const avg = document.getElementById('avg').value;
    const statusMsg = document.getElementById('status-msg');

    if (!fName || !lName || !avg) return alert("Remplissez tout !");

    try {
        statusMsg.innerText = "Signature requise...";
        statusMsg.style.color = "var(--primary)";

        const tx = await contract.addStudent(fName, lName, dob, avg);
        statusMsg.innerText = "Transaction envoyée... Attente confirmation.";
        
        await tx.wait(); 

        statusMsg.innerText = "✅ Enregistré sur Blockchain !";
        statusMsg.style.color = "#10b981";
        
        // Reset
        document.getElementById('fName').value = "";
        document.getElementById('lName').value = "";
        document.getElementById('avg').value = "";
        
        // Recharger (ça va chercher le nouveau hash automatiquement)
        loadStudents();

    } catch (error) {
        console.error(error);
        statusMsg.innerText = "Erreur : " + error.message;
        statusMsg.style.color = "#ef4444";
    }
}

// --- 5. CHARGEMENT INTELLIGENT (AVEC VRAIS HASHES) ---
async function loadStudents() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Chargement depuis la Blockchain...</td></tr>';
    
    try {
        const myAddress = await signer.getAddress();
        
        // A. On récupère les étudiants
        const students = await contract.getMyStudents();

        // B. TECHNIQUE PRO : On récupère l'historique des événements "StudentAdded"
        // pour retrouver les Hashes de transaction
        const filter = contract.filters.StudentAdded(myAddress);
        const events = await contract.queryFilter(filter);

        // On crée un dictionnaire : ID -> Hash
        const idToHash = {};
        events.forEach(event => {
            // event.args[1] est l'ID dans l'événement StudentAdded(user, id, name)
            const id = event.args[1].toString();
            idToHash[id] = event.transactionHash;
        });

        tableBody.innerHTML = ""; // On vide le chargement

        if (students.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:20px;">Aucun étudiant.</td></tr>`;
            return;
        }

        // On inverse la boucle pour voir les nouveaux en premier (optionnel, sinon forEach classique)
        for(let i = 0; i < students.length; i++) {
            const s = students[i];
            if (s.exists) {
                // On cherche le vrai hash venant de l'événement
                const realHash = idToHash[s.id.toString()];
                
                let hashDisplay = "...";
                if (realHash) {
                    hashDisplay = `<a href="https://sepolia.etherscan.io/tx/${realHash}" target="_blank" class="hash-link">
                        ${realHash.substring(0, 10)}... ↗
                    </a>`;
                } else {
                    hashDisplay = `<span style="opacity:0.5">Ancien (Non-indexé)</span>`;
                }

                const row = `
                    <tr>
                        <td><b>#${s.id}</b></td>
                        <td>${s.firstName} ${s.lastName}</td>
                        <td>${s.dob}</td>
                        <td><span style="color:var(--primary); font-weight:bold">${s.average}/20</span></td>
                        <td>${hashDisplay}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            }
        }
    } catch (err) { 
        console.error("Erreur chargement:", err); 
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:red">Erreur Web3</td></tr>`;
    }
}

// Thème
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
    updateThemeBtnText(target);
}
function updateThemeBtnText(theme) {
    document.querySelector('.theme-toggle').innerText = theme === 'dark' ? '☀ Mode Jour' : '☾ Mode Nuit';
}