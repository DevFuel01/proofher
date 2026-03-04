<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$requiredFields = ['credential_id', 'full_name', 'skill', 'level', 'issuer_name', 'evidence_url', 'issued_date'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        echo json_encode(['ok' => false, 'error' => "Missing required field: $field"]);
        exit;
    }
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO credentials 
        (credential_id, full_name, skill, level, issuer_name, evidence_url, issued_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $data['credential_id'],
        $data['full_name'],
        $data['skill'],
        $data['level'],
        $data['issuer_name'],
        $data['evidence_url'],
        $data['issued_date']
    ]);

    echo json_encode(['ok' => true, 'message' => 'Credential saved successfully']);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) { // Integrity constraint violation (Duplicate entry)
        echo json_encode(['ok' => false, 'error' => 'Credential ID already exists']);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
    }
}