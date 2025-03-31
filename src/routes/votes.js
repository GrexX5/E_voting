const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// POST /api/votes - Enregistre un vote
router.post('/', auth, async (req, res) => {
    const { candidateId } = req.body;
    const userId = req.user.id;

    if (!candidateId) {
        return res.status(400).json({ message: 'ID du candidat requis' });
    }

    try {
        // Vérifie si le candidat existe
        const [candidate] = await db.query(
            'SELECT id FROM candidates WHERE id = ?',
            [candidateId]
        );

        if (candidate.length === 0) {
            return res.status(404).json({ message: 'Candidat non trouvé' });
        }

        // Vérifie si l'utilisateur a déjà voté
        const [existingVote] = await db.query(
            'SELECT id FROM votes WHERE user_id = ?',
            [userId]
        );

        if (existingVote.length > 0) {
            return res.status(400).json({ message: 'Vous avez déjà voté' });
        }

        // Enregistre le vote
        await db.query(
            'INSERT INTO votes (user_id, candidate_id) VALUES (?, ?)',
            [userId, candidateId]
        );

        res.status(201).json({ message: 'Vote enregistré avec succès' });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du vote:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET /api/votes/stats - Statistiques des votes (public)
router.get('/stats', async (req, res) => {
    try {
        // Récupère le nombre total de votes
        const [totalVotes] = await db.query(
            'SELECT COUNT(*) as count FROM votes'
        );

        // Récupère le nombre de votes par candidat
        const [votesByCandidate] = await db.query(`
            SELECT c.name, COUNT(v.id) as votes
            FROM candidates c
            LEFT JOIN votes v ON c.id = v.candidate_id
            GROUP BY c.id, c.name
            ORDER BY votes DESC
        `);

        res.json({
            total: totalVotes[0].count,
            byCandidate: votesByCandidate
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
