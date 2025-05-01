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
error_log("Datos recibidos en create_subcategory.php: " . json_encode($data));

if (!isset($data['name']) || !isset($data['parent_id'])) { // Validar parent_id
    error_log("Error: Faltan datos para crear la subcategoría.");
    error_log("Datos recibidos: " . json_encode($data)); // Depuración adicional
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Faltan datos para crear la subcategoría.']);
    exit();
}

$name = trim($data['name']);
$parent_id = intval($data['parent_id']);
error_log("Nombre de la subcategoría recibido: " . $name . ", Parent ID: " . $parent_id);

try {
    // Verificar si la categoría principal existe
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id AND parent_id IS NULL");
    $stmt->bindParam(':id', $parent_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        error_log("Error: Categoría principal no encontrada o no válida: ID " . $parent_id);
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'Categoría principal no encontrada.']);
        exit();
    }

    // Insertar la subcategoría
    $stmt = $pdo->prepare("INSERT INTO categories (name, parent_id) VALUES (:name, :parent_id)");
    $stmt->bindParam(':name', $name, PDO::PARAM_STR);
    $stmt->bindParam(':parent_id', $parent_id, PDO::PARAM_INT);
    $stmt->execute();

    $subcategory_id = $pdo->lastInsertId();
    error_log("Subcategoría creada correctamente: ID " . $subcategory_id);

    echo json_encode(['success' => true, 'message' => 'Subcategoría creada correctamente.', 'subcategory' => ['id' => $subcategory_id, 'name' => $name]]);
} catch (PDOException $e) {
    error_log("Error al crear la subcategoría: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Error al crear la subcategoría.', 'error' => $e->getMessage()]);
}
?>
