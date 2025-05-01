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
if (!isset($data['category_id'])) {
    error_log("Error: Falta el ID de la categoría.");
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Falta el ID de la categoría.']);
    exit();
}

$category_id = intval($data['category_id']);
error_log("Categoría ID recibido: " . $category_id);

try {
    // Verificar si la categoría existe y no tiene un parent_id
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id AND parent_id IS NULL");
    $stmt->bindParam(':id', $category_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        error_log("Error: Categoría no encontrada o no es una categoría principal: ID " . $category_id);
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'Categoría no encontrada o no válida.']);
        exit();
    }

    // Eliminar las subcategorías asociadas
    $stmt = $pdo->prepare("DELETE FROM categories WHERE parent_id = :parent_id");
    $stmt->bindParam(':parent_id', $category_id, PDO::PARAM_INT);
    $stmt->execute();
    error_log("Subcategorías eliminadas para la categoría ID: " . $category_id);

    // Eliminar la categoría principal
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = :id");
    $stmt->bindParam(':id', $category_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        error_log("Categoría eliminada correctamente: ID " . $category_id);
        echo json_encode(['success' => true, 'message' => 'Categoría eliminada correctamente.']);
    } else {
        error_log("Error: No se pudo eliminar la categoría: ID " . $category_id);
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => 'Error al eliminar la categoría.']);
    }
} catch (PDOException $e) {
    error_log("Error al eliminar la categoría: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Error al eliminar la categoría.', 'error' => $e->getMessage()]);
}
?>
