<?php
// Configuración dinámica de CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
        header("Access-Control-Allow-Credentials: true"); // Permitir credenciales
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

if (!isset($_GET['category_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'category_id is required']);
    exit;
}

$category_id = intval($_GET['category_id']);

try {
    $query = "SELECT id, name FROM categories WHERE parent_id = :category_id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    $stmt->execute();

    $subcategories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($subcategories);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching subcategories']);
}
?>