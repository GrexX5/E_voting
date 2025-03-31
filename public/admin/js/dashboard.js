// Vérification du token JWT
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return null;
    }
    return token;
}

// Fonction pour afficher un toast de notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.remove('translate-y-full');
    toast.classList.add('translate-y-0');
    
    if (isError) {
        toastMessage.classList.add('text-red-600');
    } else {
        toastMessage.classList.remove('text-red-600');
    }

    setTimeout(() => {
        hideToast();
    }, 3000);
}

function hideToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('translate-y-0');
    toast.classList.add('translate-y-full');
}

// Fonction pour charger les candidats
async function loadCandidates() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/api/candidates', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Erreur lors du chargement des candidats');
        
        const candidates = await response.json();
        const tbody = document.getElementById('candidatesList');
        tbody.innerHTML = '';
        
        candidates.forEach(candidate => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="whitespace-nowrap py-4 pl-4 pr-3">
                    <img src="${candidate.photo_url}" alt="${candidate.name}" class="h-12 w-12 rounded-full object-cover">
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">${candidate.name}</td>
                <td class="px-3 py-4 text-sm text-gray-900">${candidate.description}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">${candidate.votes_count}</td>
                <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                    <button onclick="deleteCandidate(${candidate.id})" class="text-red-600 hover:text-red-900">
                        Supprimer
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Mise à jour des statistiques
        document.getElementById('candidateCount').textContent = candidates.length;
        const totalVotes = candidates.reduce((sum, c) => sum + c.votes_count, 0);
        document.getElementById('totalVotes').textContent = totalVotes;

    } catch (error) {
        showToast(error.message, true);
    }
}

// Fonction pour charger les statistiques
async function loadStats() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
        const stats = await response.json();

        // Mettre à jour les statistiques globales
        document.getElementById('totalVotes').textContent = stats.totalVotes;
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('participationRate').textContent = `${stats.participationRate}%`;

        // Mettre à jour les votes par candidat
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = ''; // Réinitialiser la liste

        stats.byCandidate.forEach(candidate => {
            const div = document.createElement('div');
            div.classList.add('result-card');
            div.innerHTML = `
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-2 text-center">${candidate.name}</h3>
                    <p class="text-gray-600 text-center">Votes : ${candidate.votes}</p>
                </div>
            `;
            resultsList.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur:', error.message);
        showToast('Erreur lors du chargement des statistiques', true);
    }
}

// Charger les statistiques au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadCandidates(); // Si vous avez déjà une fonction pour charger les candidats
});

// Fonction pour ajouter un candidat
async function addCandidate(event) {
    event.preventDefault();
    const token = checkAuth();
    if (!token) return;

    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const photo_url = document.getElementById('photo_url').value;

    const formData = { name, description, photo_url };

    try {
        const response = await fetch('/api/candidates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de l\'ajout du candidat');
        }

        showToast('Candidat ajouté avec succès');
        document.getElementById('addCandidateForm').reset();
        loadCandidates();
        loadStats(); // Mettre à jour les statistiques

    } catch (error) {
        console.error(error.message);
        showToast(error.message, true);
    }
}

// Fonction pour supprimer un candidat
async function deleteCandidate(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) return;
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`/api/candidates/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erreur lors de la suppression du candidat');

        showToast('Candidat supprimé avec succès');
        loadCandidates();
        loadStats(); // Mettre à jour les statistiques

    } catch (error) {
        showToast(error.message, true);
    }
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadCandidates();
    document.getElementById('addCandidateForm').addEventListener('submit', addCandidate);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});
