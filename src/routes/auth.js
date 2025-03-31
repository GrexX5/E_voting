const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Route de connexion
router.post('/login', async (req, res) => {
    console.log('Tentative de connexion avec:', req.body);
    const { email, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        console.log('Résultat de la requête utilisateur:', users);

        const user = users[0];

        if (!user) {
            console.log('Utilisateur non trouvé:', email);
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        console.log('Utilisateur trouvé:', { 
            id: user.id, 
            email: user.email, 
            is_admin: user.is_admin 
        });

        // Vérifier le mot de passe
        console.log('Vérification du mot de passe pour:', email);
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Résultat de la comparaison du mot de passe:', validPassword);
        
        if (!validPassword) {
            console.log('Mot de passe invalide pour:', email);
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email,
                is_admin: user.is_admin
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Token JWT généré avec succès');

        // Envoyer la réponse
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                is_admin: user.is_admin
            }
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la connexion',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route d'inscription
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer l'utilisateur
        const [result] = await db.query(
            'INSERT INTO users (email, password, is_admin) VALUES (?, ?, FALSE)',
            [email, hashedPassword]
        );

        // Générer le token JWT
        const token = jwt.sign(
            { 
                id: result.insertId,
                email: email,
                is_admin: false
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: result.insertId,
                email: email,
                is_admin: false
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ 
            message: 'Erreur lors de l\'inscription',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
