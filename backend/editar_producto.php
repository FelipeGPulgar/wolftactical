<?php
session_start();

// Configuración de CORS dinámica
$allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3003",
    "http://127.0.0.1:3000"
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Default para desarrollo
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Manejar solicitud OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

if (!isset($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? null;
    $nombre = $_POST['nombre'] ?? '';
    $modelo = $_POST['modelo'] ?? '';
    $categoria = $_POST['categoria'] ?? '';
    $subcategoria = $_POST['subcategoria'] ?? '';
    $stock_option = $_POST['stock_option'] ?? 'preorder';
    $stock_quantity = $stock_option === 'stock' ? ($_POST['stock_quantity'] ?? null) : null;
    $precio = $_POST['precio'] ?? '';

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID del producto no proporcionado']);
        exit();
    }

    try {
        if (!empty($_FILES['imagen']['name'])) {
            $imagen = $_FILES['imagen']['name'];
            move_uploaded_file($_FILES['imagen']['tmp_name'], 'imagenes/' . $imagen);
            $sql = "UPDATE products SET name = :nombre, model = :modelo, category = :categoria, subcategory = :subcategoria, 
                    stock_option = :stock_option, stock_quantity = :stock_quantity, price = :precio, main_image = :imagen WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nombre' => $nombre, 'modelo' => $modelo, 'categoria' => $categoria, 'subcategoria' => $subcategoria, 
                            'stock_option' => $stock_option, 'stock_quantity' => $stock_quantity, 'precio' => $precio, 'imagen' => $imagen, 'id' => $id]);
        } else {
            $sql = "UPDATE products SET name = :nombre, model = :modelo, category = :categoria, subcategory = :subcategoria, 
                    stock_option = :stock_option, stock_quantity = :stock_quantity, price = :precio WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nombre' => $nombre, 'modelo' => $modelo, 'categoria' => $categoria, 'subcategoria' => $subcategoria, 
                            'stock_option' => $stock_option, 'stock_quantity' => $stock_quantity, 'precio' => $precio, 'id' => $id]);
        }
        echo json_encode(['success' => true, 'message' => 'Producto actualizado con éxito']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
    }
}
?>