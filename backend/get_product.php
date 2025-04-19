<?php
session_start();

// Configuración de CORS
header("Access-Control-Allow-Origin: http://localhost:3003");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Manejar solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

// Verificar autenticación
if (!isset($_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
    exit();
}

$id = intval($_GET['id']);

try {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Producto no encontrado']);
        exit();
    }

    echo json_encode([
        'success' => true,
        'product' => [
            'id' => $product['id'],
            'name' => $product['name'],
            'model' => $product['model'],
            'category' => $product['category'],
            'subcategory' => $product['subcategory'],
            'stock_option' => $product['stock_option'],
            'stock_quantity' => $product['stock_quantity'],
            'price' => $product['price'],
            'main_image' => $product['main_image']
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
}
?>