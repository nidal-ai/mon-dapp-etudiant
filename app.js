let provider, signer, contract;

// ==========================================
// 1. INITIALISATION
// ==========================================
window.onload = () => {
    if (typeof CONTRACT_ADDRESS === 'undefined') { alert("Erreur: config.js manquant"); return; }
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    setTimeout(() => {
        const loader = document.getElementById('loader-overlay');
        const content = document.getElementById('app-content');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                content.classList.remove('hidden');
                setTimeout(() => { content.classList.remove('opacity-0'); }, 50);
            }, 500);
        }
    }, 1000);
};

window.toggleTheme = function() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
};

// ==========================================
// 2. NAVIGATION
// ==========================================
window.handleChoice = function(hasMetaMask) {
    document.getElementById('welcome-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('connect-section').classList.remove('hidden');
        if (hasMetaMask) {
            document.getElementById('connect-block').classList.remove('hidden');
            checkMobileEnv();
        } else {
            document.getElementById('download-block').classList.remove('hidden');
        }
    }, 500);
};

window.goBack = function() {
    if (!document.getElementById('dashboard').classList.contains('hidden')) {
        location.reload(); return;
    }
    document.getElementById('connect-block').classList.add('hidden');
    document.getElementById('download-block').classList.add('hidden');
    document.getElementById('connect-section').classList.add('hidden');
    const welcome = document.getElementById('welcome-screen');
    welcome.classList.remove('hidden');
    setTimeout(() => { welcome.style.opacity = '1'; }, 50);
};

window.checkMobileEnv = function() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !window.ethereum) {
        document.getElementById('connectBtn').classList.add('hidden');
        document.getElementById('mobile-deep-link').classList.remove('hidden');
        const currentUrl = window.location.href.replace("https://", "");
        const deepLink = `https://metamask.app.link/dapp/${currentUrl}`;
        document.getElementById('mobileBtn').onclick = () => window.location.href = deepLink;
    }
};

// ==========================================
// 3. LOGIQUE REGISTRE ÉTUDIANT
// ==========================================
window.addStudent = async function() {
    const fName = document.getElementById('fName').value.trim();
    const lName = document.getElementById('lName').value.trim();
    const dob = document.getElementById('dob').value;
    const avg = document.getElementById('avg').value;
    let diplomaId = 0;
    const diplomaInput = document.getElementById('diplomaId'); 
    if (diplomaInput && diplomaInput.value) diplomaId = diplomaInput.value;

    const statusMsg = document.getElementById('status-msg');

    if (!fName || !lName || !dob || !avg) return alert("Veuillez remplir tous les champs");

    // Validation Date
    const birthYear = parseInt(dob.split('-')[0]);
    const currentYear = new Date().getFullYear();
    if (birthYear < 1960 || birthYear > (currentYear - 16)) {
        return alert(`Erreur : L'année ${birthYear} n'est pas réaliste !`);
    }

    try {
        statusMsg.innerText = "Vérification doublons...";
        statusMsg.className = "text-blue-500 text-xs mt-4 text-center";

        const existingStudents = await contract.getMyStudents();
        for (let s of existingStudents) {
            if (s.exists && s.firstName.toLowerCase() === fName.toLowerCase() && s.lastName.toLowerCase() === lName.toLowerCase()) {
                statusMsg.innerText = "";
                return alert(`Attention : ${fName} ${lName} existe déjà !`);
            }
        }

        statusMsg.innerText = "Signature requise...";
        statusMsg.className = "text-blue-500 animate-pulse text-xs mt-4 text-center font-medium";
        
        const tx = await contract.addStudent(fName, lName, dob, avg, diplomaId);
        
        statusMsg.innerText = "Envoi transaction...";
        await tx.wait();
        
        statusMsg.innerText = "Enregistré avec succès !";
        statusMsg.className = "text-emerald-500 font-bold text-xs mt-4 text-center";
        
        document.getElementById('fName').value = "";
        document.getElementById('lName').value = "";
        document.getElementById('dob').value = "";
        document.getElementById('avg').value = "";
        if(diplomaInput) diplomaInput.value = "";
        
        loadStudents();
    } catch (error) {
        console.error(error);
        statusMsg.innerText = "Erreur Transaction";
        statusMsg.className = "text-red-500 text-xs mt-4 text-center font-medium";
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) connectBtn.addEventListener('click', connectWallet);
});

async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask introuvable");
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
             try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }],
                });
            } catch (e) { alert("Réseau Sepolia requis"); return; }
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
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('flex');
    document.getElementById('nav-badge').classList.remove('hidden');
    
    loadStudents();
}

async function loadStudents() {
    const tableBody = document.getElementById('tableBody');
    if(!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-8 opacity-50 text-gray-600 dark:text-gray-400">Chargement...</td></tr>';
    
    try {
        const myAddress = await signer.getAddress();
        const students = await contract.getMyStudents();
        const filter = contract.filters.StudentAdded(myAddress);
        const events = await contract.queryFilter(filter);
        const idToHash = {};
        events.forEach(e => { idToHash[e.args[1].toString()] = e.transactionHash; });

        tableBody.innerHTML = "";
        
        let verifiedCount = 0;
        let realTotalCount = 0;

        if (students.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 opacity-50 text-gray-600 dark:text-gray-400">Aucun dossier.</td></tr>`;
            document.getElementById('stat-total').innerText = "0";
            document.getElementById('footer-count').innerText = "Total: 0 dossier(s)";
            return;
        }

        for(let i = students.length - 1; i >= 0; i--) {
            const s = students[i];
            if (s.exists) {
                realTotalCount++;
                const realHash = idToHash[s.id.toString()];
                if(realHash) verifiedCount++;
                
                let hashDisplay = realHash ? 
                    `<a href="https://sepolia.etherscan.io/tx/${realHash}" target="_blank" class="inline-block px-2 py-1 rounded bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 text-xs font-mono hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-colors">HASH ↗</a>` : 
                    `<span class="text-gray-400 dark:text-slate-600 text-xs">En attente</span>`;

                let dateDisplay = s.dob;
                if (s.dob && s.dob.includes('-')) {
                    const [yyyy, mm, dd] = s.dob.split('-');
                    dateDisplay = `${dd}/${mm}/${yyyy}`;
                }

                let diplomaBadge = `<span class="text-gray-400 text-xs opacity-50">-</span>`;
                if (s.diplomaId && s.diplomaId > 0) {
                     diplomaBadge = `<button onclick="document.getElementById('nftTokenId').value='${s.diplomaId}'; verifyDiploma();" class="px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 text-xs font-bold hover:scale-105 transition-transform cursor-pointer">NFT #${s.diplomaId}</button>`;
                }

                const row = `<tr class="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                        <td class="py-3 px-4 font-bold text-left text-gray-900 dark:text-white">${s.firstName}</td>
                        <td class="py-3 px-4 font-bold text-left text-gray-900 dark:text-white">${s.lastName}</td>
                        <td class="py-3 px-4 text-center text-gray-600 dark:text-slate-400">${dateDisplay}</td>
                        <td class="py-3 px-4 text-center"><span class="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-xs">${s.average}/20</span></td>
                        <td class="py-3 px-4 text-center">${diplomaBadge}</td>
                        <td class="py-3 px-4 text-center">${hashDisplay}</td>
                    </tr>`;
                tableBody.innerHTML += row;
            }
        }

        document.getElementById('stat-total').innerText = realTotalCount;
        document.getElementById('stat-verified').innerText = verifiedCount;
        document.getElementById('footer-count').innerText = `Total: ${realTotalCount} dossier(s) enregistré(s) sur la blockchain`;

    } catch (err) { console.error(err); }
}

window.filterStudents = function() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('studentTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 0; i < tr.length; i++) {
        const tdFirst = tr[i].getElementsByTagName("td")[0]; 
        const tdLast = tr[i].getElementsByTagName("td")[1];
        if (tdFirst || tdLast) {
            const txtValueFirst = tdFirst.textContent || tdFirst.innerText;
            const txtValueLast = tdLast.textContent || tdLast.innerText;
            if (txtValueFirst.toUpperCase().indexOf(filter) > -1 || txtValueLast.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }       
    }
};

// ==========================================
// 4. MODULE NFT (VÉRIFICATION) - CORRECTIF
// ==========================================
async function verifyDiploma() {
    const tokenId = document.getElementById('nftTokenId').value;
    const resultDiv = document.getElementById('nft-result');
    const errorMsg = document.getElementById('nft-error');
    
    resultDiv.classList.add('hidden');
    errorMsg.classList.add('hidden');

    if (tokenId === "") return alert("Veuillez entrer un ID");

    try {
        // 1. Connexion au Contrat NFT
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
        
        // 2. Récupération des infos Blockchain
        const tokenURI = await nftContract.tokenURI(tokenId);
        const owner = await nftContract.ownerOf(tokenId);
        
        // 3. CONSTRUCTION DE L'URL IPFS (La partie importante)
        // On nettoie le lien brut venant du contrat pour avoir juste le CID
        let cid = tokenURI.replace("ipfs://", "").replace("ipfs/", "");
        
        // On utilise la passerelle officielle IPFS.IO (Plus fiable que Cloudflare)
        const gateway = "https://ipfs.io/ipfs/";
        const httpURI = gateway + cid;

        console.log("Fetching JSON from:", httpURI);

        // 4. Téléchargement du JSON
        const response = await fetch(httpURI);
        if (!response.ok) throw new Error("Impossible de lire le fichier IPFS. Vérifiez votre connexion ou l'ID.");
        
        const metadata = await response.json();

        // 5. Extraction des données
        let firstName = "Non spécifié";
        let lastName = "";
        let cin = "--";
        let date = "--";

        if (metadata.attributes) {
            const fNameAttr = metadata.attributes.find(a => a.trait_type === "Prénom" || a.trait_type === "First Name");
            const lNameAttr = metadata.attributes.find(a => a.trait_type === "Nom" || a.trait_type === "Last Name");
            const cinAttr = metadata.attributes.find(a => a.trait_type === "CIN" || a.trait_type === "ID");
            const dateAttr = metadata.attributes.find(a => a.trait_type === "Date");

            if (fNameAttr) firstName = fNameAttr.value;
            if (lNameAttr) lastName = lNameAttr.value;
            if (cinAttr) cin = cinAttr.value;
            if (dateAttr) date = dateAttr.value;
        }

        // 6. Affichage dans le HTML
        document.getElementById('nft-title').innerText = metadata.name;
        document.getElementById('nft-desc').innerText = metadata.description;
        
        // Pour l'image, on fait le même nettoyage
        let imgCid = metadata.image.replace("ipfs://", "").replace("ipfs/", "");
        document.getElementById('nft-image').src = gateway + imgCid;

        document.getElementById('nft-student-name').innerText = `${firstName} ${lastName}`;
        document.getElementById('nft-cin').innerText = cin;
        document.getElementById('nft-date').innerText = date;

        // Lien Etherscan
        const etherscanLink = `https://sepolia.etherscan.io/token/${NFT_CONTRACT_ADDRESS}?a=${tokenId}`;
        document.getElementById('nft-etherscan-link').href = etherscanLink;
        document.getElementById('nft-owner-addr').innerText = "Propriétaire: " + owner;

        // 7. Génération QR Code
        const qrContainer = document.getElementById("qrcode");
        if(qrContainer) {
            qrContainer.innerHTML = ""; 
            new QRCode(qrContainer, {
                text: etherscanLink,
                width: 60,
                height: 60,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.L
            });
        }

        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
        console.error("ERREUR NFT:", err);
        if (err.code === 'CALL_EXCEPTION') {
            errorMsg.innerText = "Erreur : Cet ID n'existe pas dans le contrat.";
        } else {
            errorMsg.innerText = "Erreur : " + err.message;
        }
        errorMsg.classList.remove('hidden');
    }
}