const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Route pour récupérer les statistiques
router.get('/stats', async (req, res) => {
    try {
        // Total des votes
        const [totalVotes] = await db.query('SELECT COUNT(*) as count FROM votes');
        
        // Total des utilisateurs
        const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
        
        // Votes par candidat
        const [votesByCandidate] = await db.query(`
            SELECT c.id, c.name, c.description, c.photo_url, COUNT(v.id) as votes
            FROM candidates c
            LEFT JOIN votes v ON c.id = v.candidate_id
            GROUP BY c.id
        `);

        // Calcul du taux de participation
        const participationRate = totalUsers[0].count > 0
            ? (totalVotes[0].count / totalUsers[0].count) * 100
            : 0;

        res.json({
            totalVotes: totalVotes[0].count,
            totalUsers: totalUsers[0].count,
            participationRate: Math.round(participationRate),
            byCandidate: votesByCandidate
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;