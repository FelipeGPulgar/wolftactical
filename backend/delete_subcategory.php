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
if (!isset($data['subcategory_id'])) {
    error_log("Error: Falta el ID de la subcategoría.");
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Falta el ID de la subcategoría.']);
    exit();
}

$subcategory_id = intval($data['subcategory_id']);
error_log("Subcategoría ID recibido: " . $subcategory_id);

try {
    // Verificar si la subcategoría existe y tiene un parent_id
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id AND parent_id IS NOT NULL");
    $stmt->bindParam(':id', $subcategory_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        error_log("Error: Subcategoría no encontrada o no es una subcategoría: ID " . $subcategory_id);
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'Subcategoría no encontrada o no válida.']);
        exit();
    }

    // Eliminar la subcategoría
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = :id");
    $stmt->bindParam(':id', $subcategory_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        error_log("Subcategoría eliminada correctamente: ID " . $subcategory_id);
        echo json_encode(['success' => true, 'message' => 'Subcategoría eliminada correctamente.']);
    } else {
        error_log("Error: No se pudo eliminar la subcategoría: ID " . $subcategory_id);
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => 'Error al eliminar la subcategoría.']);
    }
} catch (PDOException $e) {
    error_log("Error al eliminar la subcategoría: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Error al eliminar la subcategoría.', 'error' => $e->getMessage()]);
}
?>
