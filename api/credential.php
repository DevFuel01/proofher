<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require 'db.php';

if (empty($_GET['id'])) {
    echo json_encode(['ok' => false, 'error' => 'Missing credential ID']);
    exit;
}

$credentialId = $_GET['id'];

try {
    $stmt = $pdo->prepare("SELECT * FROM credentials WHERE credential_id = ?");
    $stmt->execute([$credentialId]);
    $credential = $stmt->fetch();

    if ($credential) {
        echo json_encode(['ok' => true, 'data' => $credential]);
    } else {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Credential not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['ok' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
}