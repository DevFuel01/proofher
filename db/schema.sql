CREATE DATABASE IF NOT EXISTS proofher_db;
USE proofher_db;

CREATE TABLE IF NOT EXISTS credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    skill VARCHAR(255) NOT NULL,
    level VARCHAR(100) NOT NULL,
    issuer_name VARCHAR(255) NOT NULL,
    evidence_url VARCHAR(500) NOT NULL,
    issued_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
