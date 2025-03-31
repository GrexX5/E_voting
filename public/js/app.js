// Gestionnaire de routes
const routes = {
    home: () => showHome(),
    vote: () => showVotePage(),
    results: () => showResults(),
    login: () => showLoginPage(),
    admin: () => showAdminDashboard()
};

// Point d'entrée de l'application
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupLoginButton();
    
    // Charger la page initiale
    const currentPage = window.location.hash.slice(1) || 'home';
    navigateTo(currentPage);
});

// Configuration de la navigation
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            navigateTo(page);
            updateActiveLink(e.target);
        });
    });
}

function setupLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.addEventListener('click', () => {
        const isLoggedIn = localStorage.getItem('token');
        if (isLoggedIn) {
            logout();
        } else {
            navigateTo('login');
        }
    });
    updateLoginButton();
}

// Fonction de navigation
function navigateTo(page) {
    window.history.pushState({}, '', `#${page}`);
    routes[page]();
}

// Mise à jour des éléments UI
function updateActiveLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('border-primary-500', 'text-primary-600');
        link.classList.add('text-gray-500', 'hover:text-gray-700');
    });
    if (activeLink) {
        activeLink.classList.remove('text-gray-500', 'hover:text-gray-700');
        activeLink.classList.add('border-primary-500', 'text-primary-600');
    }
}

function updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const isLoggedIn = localStorage.getItem('token');
    if (isLoggedIn) {
        loginBtn.textContent = 'Déconnexion';
        loginBtn.classList.remove('btn-primary');
        loginBtn.classList.add('btn-outline');
    } else {
        loginBtn.textContent = 'Connexion';
        loginBtn.classList.remove('btn-outline');
        loginBtn.classList.add('btn-primary');
    }
}

// Fonctions de rendu des pages
function showHome() {
    const template = document.getElementById('home-template');
    const content = template.content.cloneNode(true);
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(content);
}

async function showVotePage() {
    const template = document.getElementById('vote-template');
    const content = template.content.cloneNode(true);
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(content);
    await loadCandidates();
}

function showLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="max-w-md mx-auto">
            <div class="card">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Connexion</h2>
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="email" class="input" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input type="password" id="password" class="input" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-full">
                        Se connecter
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function showAdminDashboard() {
    if (!isAdmin()) {
        navigateTo('login');
        return;
    }

    const template = document.getElementById('admin-template');
    const content = template.content.cloneNode(true);
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(content);

    document.getElementById('add-candidate-form').addEventListener('submit', handleAddCandidate);
    await loadAdminData();
}

// Fonctions de gestion des données
async function loadCandidates() {
    try {
        const response = await fetch('/api/candidates');
        const candidates = await response.json();
        displayCandidates(candidates);
    } catch (error) {
        showError('Erreur lors du chargement des candidats');
    }
}

function displayCandidates(candidates) {
    const container = document.getElementById('candidates-list');
    const template = document.getElementById('candidate-card-template');
    
    container.innerHTML = '';
    candidates.forEach(candidate => {
        const card = template.content.cloneNode(true);
        
        card.querySelector('img').src = candidate.photo_url;
        card.querySelector('img').alt = candidate.name;
        card.querySelector('h3').textContent = candidate.name;
        card.querySelector('p').textContent = candidate.description;
        
        const voteBtn = card.querySelector('.vote-btn');
        voteBtn.dataset.id = candidate.id;
        voteBtn.addEventListener('click', () => handleVote(candidate.id));
        
        container.appendChild(card);
    });
}

async function loadAdminData() {
    try {
        const [totalVotes, participation, candidates] = await Promise.all([
            fetch('/api/stats/votes').then(r => r.json()),
            fetch('/api/stats/participation').then(r => r.json()),
            fetch('/api/candidates').then(r => r.json())
        ]);

        document.getElementById('total-votes').textContent = totalVotes.count;
        document.getElementById('participation-rate').textContent = `${participation.rate}%`;
        document.getElementById('total-candidates').textContent = candidates.length;
        
        displayCandidatesTable(candidates);
    } catch (error) {
        showError('Erreur lors du chargement des données administrateur');
    }
}

// Gestionnaires d'événements
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            updateLoginButton();
            if (data.isAdmin) {
                navigateTo('admin');
            } else {
                navigateTo('vote');
            }
        } else {
            showError('Identifiants incorrects');
        }
    } catch (error) {
        showError('Erreur lors de la connexion');
    }
}

async function handleAddCandidate(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/candidates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (response.ok) {
            form.reset();
            await loadAdminData();
            showSuccess('Candidat ajouté avec succès');
        } else {
            showError('Erreur lors de l\'ajout du candidat');
        }
    } catch (error) {
        showError('Erreur lors de l\'ajout du candidat');
    }
}

async function handleVote(candidateId) {
    if (!localStorage.getItem('token')) {
        navigateTo('login');
        return;
    }

    try {
        const response = await fetch('/api/votes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ candidateId })
        });

        if (response.ok) {
            showSuccess('Vote enregistré avec succès');
            navigateTo('results');
        } else {
            showError('Erreur lors du vote');
        }
    } catch (error) {
        showError('Erreur lors du vote');
    }
}

// Fonctions utilitaires
function isAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.isAdmin;
    } catch {
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    updateLoginButton();
    navigateTo('home');
}

function showError(message) {
    // Implémenter l'affichage des erreurs
    console.error(message);
}

function showSuccess(message) {
    // Implémenter l'affichage des succès
    console.log(message);
}
