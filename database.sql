-- Création de la base de données
CREATE DATABASE IF NOT EXISTS e_voting;
USE e_voting;

-- Suppression des tables et triggers existants
DROP TRIGGER IF EXISTS after_vote_delete;
DROP TRIGGER IF EXISTS after_vote_insert;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS users;

-- Table des candidats
CREATE TABLE candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(255),
    votes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_votes (votes_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs (incluant les admins)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(191) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email(191)),
    INDEX idx_admin (is_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des votes
CREATE TABLE votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    candidate_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (user_id),
    INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger pour incrémenter le compteur de votes
CREATE TRIGGER after_vote_insert 
AFTER INSERT ON votes 
FOR EACH ROW 
    UPDATE candidates 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.candidate_id;

-- Trigger pour décrémenter le compteur de votes
CREATE TRIGGER after_vote_delete
AFTER DELETE ON votes
FOR EACH ROW
    UPDATE candidates
    SET votes_count = votes_count - 1
    WHERE id = OLD.candidate_id;

-- Insertion de l'utilisateur admin par défaut (mot de passe: admin123)
INSERT INTO users (email, password, is_admin) VALUES 
('admin@evoting.com', '$2a$10$trFa/9OUZimixYJnA7axSuqtsWp9yZuZzOirm1fS4LjSnU./W90vK', TRUE);

-- Insertion de quelques candidats de test
INSERT INTO candidates (name, description, photo_url) VALUES
('Jean Dupont', 'Candidat expérimenté avec 10 ans d''expérience', 'https://example.com/photo1.jpg'),
('Marie Martin', 'Nouvelle candidate dynamique', 'https://example.com/photo2.jpg'),
('Pierre Durand', 'Expert en gestion de projet', 'https://example.com/photo3.jpg');
