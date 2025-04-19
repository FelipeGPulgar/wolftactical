<?php
session_start();

// Configuración de CORS
header("Access-Control-Allow-Origin: http://localhost:3003");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
if (!isset($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

// Obtener datos del formulario
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit();
}

$id = intval($input['id']);
$nombre = trim($input['nombre'] ?? '');
$modelo = trim($input['modelo'] ?? '');
$categoria = trim($input['categoria'] ?? '');
$subcategoria = trim($input['subcategoria'] ?? '');
$stock_option = trim($input['stock_option'] ?? 'preorder');
$stock_quantity = ($stock_option === 'instock') ? intval($input['stock_quantity'] ?? 0) : null;
$precio = floatval($input['precio'] ?? 0);

try {
    if (!empty($input['imagen'])) {
        // Procesar imagen (código para guardar la imagen)
        $imagen = ''; // Aquí iría el nombre del archivo de imagen procesado
        
        $sql = "UPDATE products SET 
                name = ?, model = ?, category = ?, subcategory = ?, 
                stock_option = ?, stock_quantity = ?, price = ?, main_image = ? 
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $nombre, $modelo, $categoria, $subcategoria, 
            $stock_option, $stock_quantity, $precio, $imagen, $id
        ]);
    } else {
        $sql = "UPDATE products SET 
                name = ?, model = ?, category = ?, subcategory = ?, 
                stock_option = ?, stock_quantity = ?, price = ? 
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $nombre, $modelo, $categoria, $subcategoria, 
            $stock_option, $stock_quantity, $precio, $id
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Producto actualizado']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
}
?>