# Système de Vote en Ligne

Un système de vote en ligne moderne avec une interface administrateur et utilisateur.

## Fonctionnalités

- Interface utilisateur intuitive pour voter
- Dashboard administrateur pour gérer les candidats
- Système de suivi des votes en temps réel
- Design moderne et responsive
- Sécurité renforcée avec authentification JWT

## Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v8 ou supérieur)

## Installation

1. Clonez le dépôt :
```bash
git clone [url-du-repo]
cd e-voting
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez la base de données :
- Créez une base de données MySQL
- Importez le schéma depuis `database.sql`
- Copiez `.env.example` vers `.env` et configurez les variables

4. Démarrez le serveur :
```bash
npm start
```

L'application sera accessible à l'adresse : http://localhost:3000

## Structure du Projet

```
e-voting/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── server.js
├── database.sql
├── package.json
└── .env 
```

## Sécurité

- Authentification par JWT
- Hachage des mots de passe avec bcrypt
- Protection contre les injections SQL
- Validation des données côté serveur


