require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    let connection;
    
    try {
        // Créer une connexion sans sélectionner de base de données
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('Connexion à MySQL établie...');

        // Lire le fichier SQL
        const sqlFile = path.join(__dirname, '..', '..', 'database.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Diviser le fichier en commandes individuelles
        const commands = sql.split(';').filter(cmd => cmd.trim());

        // Exécuter chaque commande
        for (let command of commands) {
            if (command.trim()) {
                await connection.query(command + ';');
                console.log('Commande SQL exécutée avec succès');
            }
        }

        console.log('Base de données initialisée avec succès !');

    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connexion fermée');
        }
    }
}

initializeDatabase();
