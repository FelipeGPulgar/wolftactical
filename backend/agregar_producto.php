<?php
// --- INICIO: Habilitar errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
// --- FIN: Depuración ---

session_start(); // Iniciar sesión para verificar autenticación

// --- Configuración CORS Dinámica ---
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

// --- Establecer Content-Type JSON para todas las respuestas ---
// Hacer esto ANTES de cualquier posible salida JSON de error
header("Content-Type: application/json");

// --- Conexión DB y Autenticación ---
require_once 'db.php'; // Usa la conexión PDO ($pdo)

// Verifica la sesión DESPUÉS de incluir db.php
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    // Use die() or exit() after sending error response
    die(json_encode(['success' => false, 'message' => 'No autorizado']));
}

// --- Lógica para Agregar Producto ---

// Asegurarse que sea método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Método no permitido
    // Use die() or exit() after sending error response
    die(json_encode(['success' => false, 'message' => 'Método no permitido. Se esperaba POST.']));
}

// --- Obtener y Validar Datos del POST ---
// Usar filter_input para más seguridad al obtener datos POST
$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_SPECIAL_CHARS);
$model = filter_input(INPUT_POST, 'model', FILTER_SANITIZE_SPECIAL_CHARS);
// Validar IDs como enteros positivos
$category_id = filter_input(INPUT_POST, 'main_category', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
$subcategory_id = filter_input(INPUT_POST, 'subcategory', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
$stock_option = $_POST['stock_option'] ?? 'preorder'; // $_POST es seguro para valores fijos
$stock_quantity_input = $_POST['stock_quantity'] ?? null; // Obtener como string o null
$price_input = $_POST['price'] ?? null;
// CORRECCIÓN: El campo is_active no se estaba enviando desde el form JS.
// Asumiremos 1 (activo) por defecto si no se envía, o tomaremos el valor si se envía.
// El form JS actual no tiene un input para is_active, así que siempre será 1.
$is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;

// Handle new fields
$descripcion = $_POST['descripcion'] ?? null;
$diseno = $_POST['diseno'] ?? null;
$materiales = $_POST['materiales'] ?? null;
$incluye = $_POST['incluye'] ?? null;
$tiene_colores = isset($_POST['colors']) ? 1 : 0;

// Validaciones
// Check if filter_input returned false (invalid int) or null (not set) for category_id
if (empty($name) || $price_input === null || $category_id === false || $category_id === null) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Nombre, precio y categoría principal válida son requeridos.']));
}
// Validate price format more strictly
if (!is_numeric($price_input) || (float)$price_input < 0) {
     http_response_code(400);
     die(json_encode(['success' => false, 'message' => 'El precio debe ser un número válido (mayor o igual a 0).']));
}
$price = (float)$price_input; // Convertir a float

$stock_quantity = null;
if ($stock_option === 'instock') {
    // Check if filter_var returned false (invalid int) or if it's null/empty string
    if ($stock_quantity_input === null || $stock_quantity_input === '' || filter_var($stock_quantity_input, FILTER_VALIDATE_INT) === false || (int)$stock_quantity_input < 0) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'La cantidad en stock debe ser un número entero válido (0 o mayor) cuando la opción es "En stock".']));
    }
    $stock_quantity = (int)$stock_quantity_input;
}

// --- Manejo de Imagen Principal ---
$main_image_relative_path = null;
if (isset($_FILES['main_image']) && $_FILES['main_image']['error'] === UPLOAD_ERR_OK && !empty($_FILES['main_image']['tmp_name'])) {
    $main_image = $_FILES['main_image'];
    $target_dir_relative = "uploads/"; // <-- Ruta relativa correcta
    $target_dir_absolute = __DIR__ . '/' . $target_dir_relative; // Absolute path on server

    // Verificar/Crear directorio
    if (!is_dir($target_dir_absolute)) {
        // Attempt to create recursively with secure permissions
        if (!mkdir($target_dir_absolute, 0775, true)) {
            error_log("Error crítico: No se pudo crear el directorio de imágenes: " . $target_dir_absolute);
            http_response_code(500);
            die(json_encode(['success' => false, 'message' => 'Error interno del servidor (Dir)']));
        }
    }
    // Check writability after attempting creation
    if (!is_writable($target_dir_absolute)) {
         error_log("Error crítico: El directorio de imágenes no tiene permisos de escritura: " . $target_dir_absolute);
         http_response_code(500);
         die(json_encode(['success' => false, 'message' => 'Error interno del servidor (Perm)']));
    }

    // Validar tipo
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $imageFileType = strtolower(pathinfo($main_image['name'], PATHINFO_EXTENSION));
    // Check if it's a real image and extension is allowed
    $check = @getimagesize($main_image['tmp_name']); // Use @ to suppress warnings if not an image
    if (!$check || !in_array($imageFileType, $allowed_extensions)) {
         http_response_code(400);
         die(json_encode(['success' => false, 'message' => 'Archivo principal no es una imagen válida o tipo no permitido.']));
    }

    // Mover archivo
    $new_filename = uniqid('prod_') . '.' . $imageFileType;
    $target_file_absolute = $target_dir_absolute . $new_filename;
    $main_image_relative_path = $target_dir_relative . $new_filename; // Store the relative path
    if (!move_uploaded_file($main_image['tmp_name'], $target_file_absolute)) {
         error_log("Error al mover archivo principal subido a " . $target_file_absolute);
         http_response_code(500);
         die(json_encode(['success' => false, 'message' => 'Error al guardar la imagen principal.']));
    }
} elseif (isset($_FILES['main_image']) && $_FILES['main_image']['error'] !== UPLOAD_ERR_NO_FILE) {
    // Handle other upload errors if a file was attempted but failed
    error_log("Error en subida de imagen principal (código: {$_FILES['main_image']['error']})");
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Error durante la subida de la imagen principal (Código: ' . $_FILES['main_image']['error'] . ')']));
} else {
    // No file uploaded and no other error -> main image is required
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'La imagen principal es requerida.']));
}


// --- Insertar Producto en la Base de Datos ---
$paramsProduct = []; // Define outside try block for logging in catch
try {
    $pdo->beginTransaction(); // Iniciar transacción

    // Insertar producto principal
    // Ensure column names match your DB schema exactly
    $sqlInsertProduct = "INSERT INTO products (name, model, category_id, subcategory_id, stock_option, stock_quantity, price, descripcion, diseno, materiales, incluye, tiene_colores, main_image, is_active, created_at, updated_at)
                         VALUES (:name, :model, :category_id, :subcategory_id, :stock_option, :stock_quantity, :price, :descripcion, :diseno, :materiales, :incluye, :tiene_colores, :main_image, :is_active, NOW(), NOW())";
    $stmtProduct = $pdo->prepare($sqlInsertProduct);
    $paramsProduct = [
        ':name' => $name,
        ':model' => $model ?: null, // Allow empty model as NULL
        ':category_id' => $category_id, // Already validated as int
        // Asegurarse de que subcategory_id sea NULL si no es válido o no se envió
        ':subcategory_id' => ($subcategory_id === false || $subcategory_id === null) ? null : $subcategory_id,
        ':stock_option' => $stock_option,
        ':stock_quantity' => $stock_quantity, // Will be NULL if stock_option is not 'instock'
        ':price' => $price,
        ':descripcion' => $descripcion,
        ':diseno' => $diseno,
        ':materiales' => $materiales,
        ':incluye' => $incluye,
        ':tiene_colores' => $tiene_colores,
        ':main_image' => $main_image_relative_path, // Relative path stored
        ':is_active' => $is_active // Usar el valor determinado antes
    ];
    $stmtProduct->execute($paramsProduct);
    $newProductId = $pdo->lastInsertId();

    // Insertar Imágenes Adicionales (Assuming 'product_images' table exists)
    // Check your form names match 'image_1', 'image_2'
    $additional_images_files = [];
    if (isset($_FILES['image_1'])) $additional_images_files[] = $_FILES['image_1'];
    if (isset($_FILES['image_2'])) $additional_images_files[] = $_FILES['image_2'];

    // Ensure product_images table exists with product_id, image_url, image_order columns
    $sqlImg = "INSERT INTO product_images (product_id, image_url, image_order) VALUES (:product_id, :image_url, :image_order)";
    $stmtImg = $pdo->prepare($sqlImg); // Prepare once outside the loop

    foreach ($additional_images_files as $index => $imageFile) {
        if ($imageFile && $imageFile['error'] === UPLOAD_ERR_OK && !empty($imageFile['tmp_name'])) {
            // (Validation and saving logic similar to main image)
            $add_imageFileType = strtolower(pathinfo($imageFile['name'], PATHINFO_EXTENSION));
            $add_check = @getimagesize($imageFile['tmp_name']);
            if ($add_check && in_array($add_imageFileType, $allowed_extensions)) {
                $add_new_filename = uniqid('prod_' . $newProductId . '_add' . ($index + 1) . '_') . '.' . $add_imageFileType;
                $add_target_file_absolute = $target_dir_absolute . $add_new_filename; // Usa la misma carpeta base
                $add_image_relative_path = $target_dir_relative . $add_new_filename; // Relative path

                if (move_uploaded_file($imageFile['tmp_name'], $add_target_file_absolute)) {
                    // Insert into product_images (let transaction handle failure)
                    $image_order = $index + 1;
                    $stmtImg->execute([
                        ':product_id' => $newProductId,
                        ':image_url' => $add_image_relative_path,
                        ':image_order' => $image_order
                    ]);
                } else {
                    // Log error but let the transaction potentially fail later if needed
                    error_log("Error al mover imagen adicional {$index} para producto ID $newProductId a $add_target_file_absolute");
                    // Optionally: throw new Exception("Failed to move additional image {$index}."); to force rollback
                }
            } else {
                 error_log("Archivo adicional {$index} inválido para producto ID $newProductId (Type: $add_imageFileType, Check: " . ($add_check ? 'OK' : 'Failed') . ")");
            }
        } elseif ($imageFile && $imageFile['error'] !== UPLOAD_ERR_NO_FILE) {
             // Log other upload errors for additional images
             error_log("Error en subida de imagen adicional {$index} (código: {$imageFile['error']}) para producto ID $newProductId");
        }
    }

    // Handle colors
    if ($tiene_colores && isset($_FILES['colors'])) {
        foreach ($_FILES['colors']['name'] as $index => $color_name) {
            $color_hex = $_POST['colors'][$index]['color'];
            $color_image = $_FILES['colors']['tmp_name'][$index];
            $image_path = "uploads/color_{$newProductId}_{$index}_" . uniqid() . ".jpeg";
            move_uploaded_file($color_image, $image_path);

            $query = "INSERT INTO product_images (product_id, tipo, color_nombre, image_url, image_order) VALUES (?, 'color', ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("issi", $newProductId, $color_hex, $image_path, $index + 1);
            $stmt->execute();
        }
    }

    // Insertar la notificación (Assuming 'notifications' table exists)
    if ($newProductId) {
        // Ensure notifications table exists with product_id, message, type, created_at columns
        $notificationMessage = "Nuevo producto agregado: '" . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "' (ID: $newProductId)";
        $notificationType = 'success';
        $sqlNotify = "INSERT INTO notifications (product_id, message, type, created_at) VALUES (:product_id, :message, :type, NOW())";
        $stmtNotify = $pdo->prepare($sqlNotify);
        $stmtNotify->execute([
            ':product_id' => $newProductId,
            ':message' => $notificationMessage,
            ':type' => $notificationType
        ]);
        error_log("Notificación creada para nuevo producto ID: " . $newProductId);
    }

    $pdo->commit(); // Confirmar transacción si todo fue bien

    // Respuesta exitosa
    http_response_code(201); // Creado
    echo json_encode(['success' => true, 'message' => 'Producto agregado con éxito', 'id' => $newProductId]);

} catch (PDOException $e) {
    // Rollback only if a transaction was active
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    // Log the detailed error including parameters <-- ¡ESTA LÍNEA GUARDA EL ERROR DETALLADO!
    error_log("Error DB al agregar producto: " . $e->getMessage() . " - Code: " . $e->getCode() . " - Params: " . json_encode($paramsProduct));
    // Provide a more user-friendly message
    if ($e->getCode() == 23000) { // Integrity constraint violation (e.g., UNIQUE key)
         echo json_encode(['success' => false, 'message' => 'Error: Ya existe un producto con datos similares (ej. nombre o modelo único).']);
    } else {
         // Mensaje genérico que estás viendo
         echo json_encode(['success' => false, 'message' => 'Error en la base de datos al agregar el producto. Verifique los datos o contacte al administrador.']);
    }
} catch (Exception $e) {
    // Catch other general errors (like potential file move failures if you throw exceptions)
    if ($pdo->inTransaction()) {
        $pdo->rollBack(); // Rollback if transaction started
    }
    http_response_code(500);
    error_log("Error general al agregar producto: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error inesperado al agregar el producto.']);
}

exit(); // Terminate script execution
?>
