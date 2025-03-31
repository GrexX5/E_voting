const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour l'upload des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Dossier où les images seront stockées
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Nom unique pour chaque fichier
    }
});
const upload = multer({ storage });

// GET /api/candidates - Liste tous les candidats
router.get('/', async (req, res) => {
    try {
        const [candidates] = await db.query(
            'SELECT id, name, description, photo_url, votes_count FROM candidates'
        );
        res.json(candidates);
    } catch (error) {
        console.error('Erreur lors de la récupération des candidats:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST /api/admin/candidates - Ajoute un nouveau candidat (admin seulement)
router.post('/', adminAuth, async (req, res) => {
    const { name, description, photo_url } = req.body;

    // Validation des données
    if (!name || !description || !photo_url) {
        return res.status(400).json({ message: 'Nom, description et URL de la photo sont requis' });
    }

    try {
        // Insertion du candidat
        const [result] = await db.query(
            'INSERT INTO candidates (name, description, photo_url) VALUES (?, ?, ?)',
            [name, description, photo_url]
        );

        // Récupération du candidat ajouté
        const [newCandidate] = await db.query(
            'SELECT id, name, description, photo_url FROM candidates WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newCandidate[0]);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du candidat:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// DELETE /api/admin/candidates/:id - Supprime un candidat (admin seulement)
router.delete('/:id', /*adminAuth,*/ async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifie si le candidat existe
        const [candidate] = await db.query(
            'SELECT id FROM candidates WHERE id = ?',
            [id]
        );

        if (candidate.length === 0) {
            return res.status(404).json({ message: 'Candidat non trouvé' });
        }

        // Supprime les votes associés au candidat
        await db.query('DELETE FROM votes WHERE candidate_id = ?', [id]);
        
        // Supprime le candidat
        await db.query('DELETE FROM candidates WHERE id = ?', [id]);

        res.json({ message: 'Candidat supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du candidat:', error.message, error.stack);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;


