<?php
// Configuración dinámica de CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
        header("Access-Control-Allow-Credentials: true");
    }
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir la conexión a la base de datos
require_once 'db.php';

// Verificar si los datos se enviaron correctamente
$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['name'])) {
    error_log("Error: Falta el nombre de la categoría.");
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Falta el nombre de la categoría.']);
    exit();
}

$name = trim($data['name']);
error_log("Nombre de la categoría recibido: " . $name);

try {
    // Insertar la categoría principal
    $stmt = $pdo->prepare("INSERT INTO categories (name, parent_id) VALUES (:name, NULL)");
    $stmt->bindParam(':name', $name, PDO::PARAM_STR);
    $stmt->execute();

    $category_id = $pdo->lastInsertId();
    error_log("Categoría creada correctamente: ID " . $category_id);

    echo json_encode(['success' => true, 'message' => 'Categoría creada correctamente.', 'category' => ['id' => $category_id, 'name' => $name]]);
} catch (PDOException $e) {
    error_log("Error al crear la categoría: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Error al crear la categoría.', 'error' => $e->getMessage()]);
}
?>
