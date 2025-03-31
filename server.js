require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

// Import des routes
const authRoutes = require('./src/routes/auth');
const candidatesRoutes = require('./src/routes/candidates');
const votesRoutes = require('./src/routes/votes');
const statsRoutes = require('./src/routes/stats');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api', statsRoutes);

// Route pour les statistiques admin
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [totalVotes] = await db.query('SELECT COUNT(*) as count FROM votes');
        const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
        const participationRate = (totalVotes[0].count / totalUsers[0].count) * 100;

        res.json({
            totalVotes: totalVotes[0].count,
            totalUsers: totalUsers[0].count,
            participationRate: Math.round(participationRate)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route principale pour le SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Une erreur est survenue',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
