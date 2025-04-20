<?php
session_start();

// Cambiar el valor de 'Access-Control-Allow-Origin' para permitir múltiples orígenes
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Valor predeterminado
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
    $is_active = $_POST['is_active'] ?? 1;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID del producto no proporcionado']);
        exit();
    }

    // Fetch the current product data before updating
    $currentProductStmt = $pdo->prepare("SELECT * FROM products WHERE id = :id");
    $currentProductStmt->execute(['id' => $id]);
    $currentProduct = $currentProductStmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentProduct) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Producto no encontrado']);
        exit();
    }

    try {
        if (!empty($_FILES['imagen']['name'])) {
            $imagen = $_FILES['imagen']['name'];
            move_uploaded_file($_FILES['imagen']['tmp_name'], 'imagenes/' . $imagen);
            $sql = "UPDATE products SET name = :nombre, model = :modelo, category = :categoria, subcategory = :subcategoria, 
                    stock_option = :stock_option, stock_quantity = :stock_quantity, price = :precio, main_image = :imagen, is_active = :is_active WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nombre' => $nombre, 'modelo' => $modelo, 'categoria' => $categoria, 'subcategoria' => $subcategoria, 
                            'stock_option' => $stock_option, 'stock_quantity' => $stock_quantity, 'precio' => $precio, 'imagen' => $imagen, 'is_active' => $is_active, 'id' => $id]);
        } else {
            $sql = "UPDATE products SET name = :nombre, model = :modelo, category = :categoria, subcategory = :subcategoria, 
                    stock_option = :stock_option, stock_quantity = :stock_quantity, price = :precio, is_active = :is_active WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nombre' => $nombre, 'modelo' => $modelo, 'categoria' => $categoria, 'subcategoria' => $subcategoria, 
                            'stock_option' => $stock_option, 'stock_quantity' => $stock_quantity, 'precio' => $precio, 'is_active' => $is_active, 'id' => $id]);
        }

        // Compare old and new values to generate dynamic notifications for all fields
        $changes = [];
        if ($currentProduct['name'] !== $nombre) {
            $changes[] = "El nombre del producto cambió de '{$currentProduct['name']}' a '$nombre'.";
        }
        if ($currentProduct['model'] !== $modelo) {
            $changes[] = "El modelo del producto cambió de '{$currentProduct['model']}' a '$modelo'.";
        }
        if ($currentProduct['category'] !== $categoria) {
            $changes[] = "La categoría del producto cambió de '{$currentProduct['category']}' a '$categoria'.";
        }
        if ($currentProduct['subcategory'] !== $subcategoria) {
            $changes[] = "La subcategoría del producto cambió de '{$currentProduct['subcategory']}' a '$subcategoria'.";
        }
        if ($currentProduct['stock_option'] !== $stock_option) {
            $changes[] = "La opción de stock cambió de '{$currentProduct['stock_option']}' a '$stock_option'.";
        }
        if ($currentProduct['stock_quantity'] != $stock_quantity) {
            $changes[] = "La cantidad de stock cambió de {$currentProduct['stock_quantity']} a $stock_quantity.";
        }
        if ($currentProduct['price'] != $precio) {
            $changes[] = "El precio del producto cambió de {$currentProduct['price']} a $precio.";
        }
        if ($currentProduct['main_image'] !== $imagen && !empty($imagen)) {
            $changes[] = "La imagen principal del producto fue actualizada.";
        }
        if ($currentProduct['is_active'] != $is_active) {
            $changes[] = "El estado del producto cambió a " . ($is_active ? "activo" : "inactivo") . ".";
        }

        // Combine all changes into a single message
        if (!empty($changes)) {
            $combinedMessage = implode(' ', $changes);
            $notificationSql = "INSERT INTO notifications (message, type) VALUES (:message, :type)";
            $notificationStmt = $pdo->prepare($notificationSql);
            $notificationStmt->execute([
                'message' => $combinedMessage,
                'type' => 'success'
            ]);
        }

        if (empty($changes)) {
            echo json_encode(['success' => true, 'message' => 'Producto actualizado sin cambios detectados']);
        } else {
            echo json_encode(['success' => true, 'message' => 'Producto actualizado con los siguientes cambios:', 'changes' => $combinedMessage]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
    }
}
?>