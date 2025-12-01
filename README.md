# 🎓 Student Ledger | Registre Académique Décentralisé

> **Une application Web3 (DApp) permettant la gestion sécurisée, transparente et immuable des données étudiantes sur la Blockchain Ethereum (Sepolia Testnet).**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum%20Sepolia-627eea)
![Docker](https://img.shields.io/badge/Docker-Available-2496ed)

---

## 📋 Présentation du Projet

**Student Ledger** résout le problème de la falsification des données académiques. Contrairement aux bases de données traditionnelles (SQL) qui peuvent être modifiées ou piratées, ce registre utilise la **Blockchain Ethereum** pour garantir que chaque étudiant enregistré l'est de manière définitive.

### Pourquoi la Blockchain ?
* **Immuabilité :** Une fois inscrit, un étudiant ne peut être effacé ni modifié.
* **Transparence :** Chaque ajout génère un *Hash de Transaction* vérifiable publiquement sur Etherscan.
* **Décentralisation :** Les données ne sont pas stockées sur un serveur central, mais distribuées sur le réseau.

---

## ✨ Fonctionnalités Clés

* **Authentification Web3 :** Connexion sécurisée via le portefeuille MetaMask.
* **Détection Intelligente :**
    * Support PC & Mobile (Deep Linking pour l'application MetaMask).
    * Vérification du réseau (Force la bascule automatique sur Sepolia).
* **Smart Contract Personnel :** Chaque administrateur gère sa propre liste d'étudiants liée à son adresse Wallet.
* **Preuve Cryptographique :** Récupération automatique des Hashs de transaction via les *Event Logs* de la Blockchain.
* **Interface Moderne :** Design réactif, animations fluides et Mode Sombre/Clair.

---

## 🛠️ Stack Technique

Ce projet a été construit sans framework lourd pour démontrer une compréhension fondamentale du Web3.

* **Frontend :** HTML5, CSS3 (Glassmorphism), JavaScript (ES6+).
* **Librairie Web3 :** `Ethers.js v6.7` (Interaction avec le Smart Contract).
* **Blockchain :** Solidity (Smart Contract), Remix IDE (Déploiement).
* **Réseau :** Ethereum Sepolia Testnet.
* **DevOps :** Docker (Conteneurisation).

---

## 🚀 Guide d'Installation

### Prérequis
Pour utiliser cette DApp, vous devez avoir :
1.  **MetaMask** installé sur votre navigateur (ou mobile).
2.  Des **Sepolia ETH** (Testnet) pour payer les frais de gas (Disponibles via [Sepolia Faucet](https://sepoliafaucet.com/)).

### Accès Rapide (Démo en ligne)
Le projet est hébergé et accessible directement ici :
👉 **https://nidal-ai.github.io/student-ledger/**

**📸 Aperçu :** L'application guide l'utilisateur à travers 3 étapes :
1. Vérification de l'environnement (Avez-vous MetaMask ?).
2. Connexion du Wallet (Signature numérique).
3. Dashboard de gestion (Ajout et consultation du registre).

### Installation Locale (Pour les développeurs)
Ce projet est **Open Source**. Si vous souhaitez explorer le code, le tester localement ou proposer des améliorations :

1.  Téléchargez le projet en cliquant sur le bouton vert **<> Code** ➔ **Download ZIP** en haut de la page.
2.  Extrayez (dézippez) les fichiers dans un dossier sur votre ordinateur.
3.  Double-cliquez simplement sur le fichier `index.html` pour lancer l'application dans votre navigateur.
4.  *Note : Assurez-vous d'avoir l'extension MetaMask active pour interagir avec l'application.*

### 🐳 Installation via Docker
Le projet est également disponible sous forme d'image conteneurisée sur **Docker Hub** pour un déploiement rapide et standardisé.

1.  Assurez-vous que **Docker** est installé et lancé sur votre machine.
2.  Rendez-vous sur **Docker Hub** et connectez-vous.
3.  Recherchez le profil utilisateur **`Nidal49`** (ou cliquez ici : https://hub.docker.com/repository/docker/nidal49/student-ledger/general.
4.  Une fois l'image repérée, vous pouvez copier le lien ou utiliser directement les commandes ci-dessous dans votre terminal :

**Télécharger l'image :**
```bash
docker pull nidal49/student-ledger:v1

Lancer le conteneur :
docker run -d -p 8080:80 nidal49/student-ledger:v1

Ouvrez votre navigateur et allez sur http://localhost:8080 pour voir l'application.

Note : La commande run map le port 80 du conteneur vers le port 8080 de votre machine locale.
