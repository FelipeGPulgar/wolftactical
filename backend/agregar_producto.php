<?php
// Habilitar CORS dinámico para coincidir con el origen de la solicitud
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Manejo de errores para solicitudes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = $_POST['name'] ?? null;
    $model = $_POST['model'] ?? null;
    $main_category = $_POST['main_category'] ?? null;
    $subcategory = $_POST['subcategory'] ?? null;
    $stock_option = $_POST['stock_option'] ?? 'preorder';
    $stock_quantity = $_POST['stock_quantity'] ?? null;
    $price = $_POST['price'] ?? null;
    $main_image = $_FILES['main_image'] ?? null;
    $additional_images = [$_FILES['image_1'] ?? null, $_FILES['image_2'] ?? null];

    if (empty($name) || empty($price) || empty($main_image)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos.']);
        exit();
    }

    // Procesar imagen principal
    $upload_dir = __DIR__ . '/uploads/';
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            error_log('Error al crear el directorio de carga: ' . $upload_dir);
            echo json_encode(['success' => false, 'message' => 'Error al crear el directorio de carga. Verifica los permisos del servidor.']);
            exit();
        }
    }

    $main_image_path = $upload_dir . basename($main_image['name']);
    if (!move_uploaded_file($main_image['tmp_name'], $main_image_path)) {
        echo json_encode(['success' => false, 'message' => 'Error al cargar la imagen principal. Verifica los permisos del directorio.']);
        exit();
    }

    // Insertar producto en la base de datos
    $sql = "INSERT INTO products (name, model, category, subcategory, stock_option, stock_quantity, price, main_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$name, $model, $main_category, $subcategory, $stock_option, $stock_quantity, $price, basename($main_image['name'])]);

    $product_id = $pdo->lastInsertId();

    // Procesar imágenes adicionales
    foreach ($additional_images as $index => $image) {
        if ($image) {
            $image_path = $upload_dir . basename($image['name']);
            if (move_uploaded_file($image['tmp_name'], $image_path)) {
                $image_order = $index + 1;
                $sql = "INSERT INTO product_images (product_id, image_url, image_order) VALUES (?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$product_id, basename($image['name']), $image_order]);
            }
        }
    }

    echo json_encode(['success' => true, 'message' => 'Producto agregado con éxito']);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>
