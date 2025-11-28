let provider, signer, contract;

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

window.addStudent = async function() {
    const fName = document.getElementById('fName').value;
    const lName = document.getElementById('lName').value;
    const dob = document.getElementById('dob').value;
    const avg = document.getElementById('avg').value;
    const statusMsg = document.getElementById('status-msg');

    if (!fName || !lName || !avg) return alert("Veuillez remplir tous les champs");

    try {
        statusMsg.innerText = "Signature requise...";
        statusMsg.className = "text-blue-500 animate-pulse text-xs mt-4 text-center font-medium";
        const tx = await contract.addStudent(fName, lName, dob, avg);
        statusMsg.innerText = "Envoi transaction...";
        await tx.wait();
        statusMsg.innerText = "Enregistré avec succès !";
        statusMsg.className = "text-emerald-500 font-bold text-xs mt-4 text-center";
        
        document.getElementById('fName').value = "";
        document.getElementById('lName').value = "";
        document.getElementById('avg').value = "";
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
    
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 opacity-50 text-gray-600 dark:text-gray-400">Chargement...</td></tr>';
    
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
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 opacity-50 text-gray-600 dark:text-gray-400">Aucun dossier.</td></tr>`;
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

                // --- FORMATAGE DATE (YYYY-MM-DD -> DD/MM/YYYY) ---
                let dateDisplay = s.dob;
                if (s.dob && s.dob.includes('-')) {
                    const [yyyy, mm, dd] = s.dob.split('-');
                    dateDisplay = `${dd}/${mm}/${yyyy}`;
                }

                const row = `<tr class="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                        <td class="py-3 px-4 font-bold text-left text-gray-900 dark:text-white">${s.firstName}</td>
                        <td class="py-3 px-4 font-bold text-left text-gray-900 dark:text-white">${s.lastName}</td>
                        <td class="py-3 px-4 text-center text-gray-600 dark:text-slate-400">${dateDisplay}</td>
                        <td class="py-3 px-4 text-center"><span class="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-xs">${s.average}/20</span></td>
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