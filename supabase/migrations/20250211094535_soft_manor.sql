/*
  # Création de la base de données de suivi des véhicules

  1. Structure
    - Base de données `suivi_vehicules`
    - Tables:
      - `vehicules`: Informations sur les véhicules et leur état actuel
      - `historique_positions`: Historique des positions des véhicules
      - `utilisateurs`: Gestion des utilisateurs et leurs rôles

  2. Contraintes
    - Clés étrangères pour lier l'historique aux véhicules
    - Contraintes d'énumération pour les statuts et rôles
    - Index pour optimiser les requêtes fréquentes
*/

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS suivi_vehicules;
USE suivi_vehicules;

-- Table des véhicules
CREATE TABLE IF NOT EXISTS vehicules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    statut ENUM('en route', 'en pause', 'terminé') NOT NULL DEFAULT 'en pause',
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    conducteur VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_statut (statut),
    INDEX idx_conducteur (conducteur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de l'historique des positions
CREATE TABLE IF NOT EXISTS historique_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicule_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE CASCADE,
    INDEX idx_vehicule_timestamp (vehicule_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('admin', 'utilisateur') NOT NULL DEFAULT 'utilisateur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de données de test
INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES
('Admin', 'admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NUn1xqG3m', 'admin'),
('User', 'user@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NUn1xqG3m', 'utilisateur');

INSERT INTO vehicules (nom, statut, latitude, longitude, conducteur) VALUES
('Camion 1', 'en route', 48.8566, 2.3522, 'Jean Dupont'),
('Camion 2', 'en pause', 45.7640, 4.8357, 'Marie Martin'),
('Camion 3', 'terminé', 43.2965, 5.3698, 'Pierre Durant');