<?php
// --- INICIO: Habilitar TODOS los errores para depuración ---
// ¡IMPORTANTE! En producción, cambia display_errors a 0 y confía en error_log.
error_reporting(E_ALL);
ini_set('display_errors', 1); // Cambiar a 0 en producción
// --- FIN: Depuración ---

session_start();

// --- Configuración CORS ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Valor predeterminado
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// --- Manejo OPTIONS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Content-Type: application/json"); // Asegurar JSON para OPTIONS
    http_response_code(200);
    exit();
}

// --- Conexión DB y Autenticación ---
// Colocar require_once ANTES de cualquier salida o header() condicional
require_once 'db.php'; // Si esto falla, el error se mostrará (gracias a error_reporting)

// Verifica la sesión DESPUÉS de incluir db.php
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    // Establecer Content-Type y código de estado ANTES de la salida JSON
    header("Content-Type: application/json");
    http_response_code(401);
    // Usar die() para terminar la ejecución después de enviar el error
    die(json_encode(['success' => false, 'message' => 'No autorizado']));
}

// --- Establecer Content-Type JSON para respuestas reales ---
// Hacer esto después de la autenticación y antes de cualquier salida principal
header("Content-Type: application/json");

// --- Manejo de solicitud GET ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $productId = $_GET['id'] ?? null;

    // Validación del ID
    if (!$productId || !filter_var($productId, FILTER_VALIDATE_INT) || (int)$productId <= 0) {
        http_response_code(400);
        // Log del error específico
        error_log("[GET Validation Error] ID de producto inválido o no proporcionado: " . print_r($_GET['id'] ?? 'NULL', true));
        die(json_encode(['success' => false, 'message' => 'ID de producto inválido o no proporcionado']));
    }
    $productId = (int)$productId;

    try {
        // 1. Obtener datos del producto
        $stmt = $pdo->prepare("SELECT id, name, model, category_id, subcategory_id, stock_option, stock_quantity, price, main_image, is_active FROM products WHERE id = :id");
        $stmt->execute([':id' => $productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            http_response_code(404);
            // Log de producto no encontrado
            error_log("[GET Info] Producto no encontrado con ID: " . $productId);
            die(json_encode(['success' => false, 'message' => 'Producto no encontrado con ID: ' . $productId]));
        }

        // 2. Obtener todas las categorías PRINCIPALES
        $catStmt = $pdo->query("SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name");
        if (!$catStmt) {
             // Este error es menos probable con query() pero se mantiene por si acaso
             throw new PDOException("Error crítico al obtener categorías principales.");
        }
        $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Obtener subcategorías de la categoría ACTUAL del producto
        $subcategories = [];
        $categoryIdToFetchSubcategories = $product['category_id'] ?? null;

        if ($categoryIdToFetchSubcategories) {
             $subStmt = $pdo->prepare("SELECT id, name FROM categories WHERE parent_id = :category_id ORDER BY name");
             // Añadir try-catch alrededor de execute si la preparación puede fallar
             if ($subStmt) {
                 $subStmt->execute([':category_id' => $categoryIdToFetchSubcategories]);
                 $subcategories = $subStmt->fetchAll(PDO::FETCH_ASSOC);
             } else {
                 // Log si la preparación de subcategorías falla (raro con PDO bien configurado)
                 error_log("[GET Warning] No se pudieron preparar subcategorías para category_id (parent_id): " . $categoryIdToFetchSubcategories);
             }
        }

        // 4. Devolver la respuesta JSON combinada
        echo json_encode([
            'success' => true,
            'product' => $product,
            'categories' => $categories,
            'subcategories' => $subcategories
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        // Log detallado del error de base de datos
        error_log("[GET DB Error] Error fetching product data for ID $productId: " . $e->getMessage());
        // Mensaje genérico para el cliente
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor al obtener datos del producto.']);
    }
    exit(); // Terminar el script después de manejar GET
}


// --- Manejo de solicitud POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener datos del POST
    $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_SPECIAL_CHARS);
    $model = filter_input(INPUT_POST, 'model', FILTER_SANITIZE_SPECIAL_CHARS);
    $category_id = filter_input(INPUT_POST, 'main_category', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $subcategory_id = filter_input(INPUT_POST, 'subcategory', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $stock_option = $_POST['stock_option'] ?? 'preorder';
    $stock_quantity_input = $_POST['stock_quantity'] ?? null;
    $price_input = $_POST['price'] ?? null;
    $is_active = isset($_POST['is_active']) ? 1 : 0;

    // --- Validación de Datos ---
    if ($id === false || $id === null) {
        http_response_code(400);
        error_log("[POST Validation Error] ID de producto inválido o no proporcionado: " . print_r($_POST['id'] ?? 'NULL', true));
        die(json_encode(['success' => false, 'message' => 'ID de producto inválido o no proporcionado']));
    }
    if (empty($name) || $price_input === null || $category_id === false || $category_id === null) {
        http_response_code(400);
        error_log("[POST Validation Error] Campos requeridos faltantes o inválidos. Name: '$name', Price: '$price_input', CategoryID: '" . print_r($category_id, true) . "'");
        die(json_encode(['success' => false, 'message' => 'Nombre, precio y categoría principal válida son requeridos.']));
    }
    if (!is_numeric($price_input) || (float)$price_input < 0) {
         http_response_code(400);
         error_log("[POST Validation Error] Formato de precio inválido: '$price_input'");
         die(json_encode(['success' => false, 'message' => 'El precio debe ser un número válido (mayor o igual a 0).']));
    }
    $price = (float)$price_input;

    $stock_quantity = null;
    if ($stock_option === 'instock') {
        if ($stock_quantity_input === null || $stock_quantity_input === '' || filter_var($stock_quantity_input, FILTER_VALIDATE_INT) === false || (int)$stock_quantity_input < 0) {
            http_response_code(400);
            error_log("[POST Validation Error] Cantidad de stock inválida para 'instock': '$stock_quantity_input'");
            die(json_encode(['success' => false, 'message' => 'La cantidad en stock debe ser un número entero válido (0 o mayor) cuando la opción es "En stock".']));
        }
        $stock_quantity = (int)$stock_quantity_input;
    }
    $subcategory_id = ($subcategory_id === false || $subcategory_id === null) ? null : $subcategory_id;

    // --- Obtener producto actual ---
    try {
        $currentProductStmt = $pdo->prepare("SELECT main_image FROM products WHERE id = :id");
        $currentProductStmt->execute(['id' => $id]);
        $currentProduct = $currentProductStmt->fetch(PDO::FETCH_ASSOC);
        if (!$currentProduct) {
            http_response_code(404);
            error_log("[POST Info] Producto no encontrado para actualizar con ID: " . $id);
            die(json_encode(['success' => false, 'message' => 'Producto no encontrado para actualizar']));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("[POST DB Error] Error fetching current product (ID: $id): " . $e->getMessage());
        die(json_encode(['success' => false, 'message' => 'Error al verificar producto existente.']));
    }

    // --- Manejo de Imagen ---
    $main_image_path = $currentProduct['main_image']; // Mantener imagen actual por defecto
    $image_updated = false;

    if (isset($_FILES['main_image']) && $_FILES['main_image']['error'] === UPLOAD_ERR_OK && !empty($_FILES['main_image']['tmp_name'])) {
        $target_dir_relative = "uploads/";
        $target_dir_absolute = __DIR__ . '/' . $target_dir_relative;

        // Verificar/Crear directorio
        if (!is_dir($target_dir_absolute)) {
            if (!mkdir($target_dir_absolute, 0775, true)) {
                error_log("[POST Image Error] No se pudo crear el directorio de imágenes: " . $target_dir_absolute);
                http_response_code(500);
                die(json_encode(['success' => false, 'message' => 'Error interno del servidor al preparar almacenamiento de imagen.']));
            }
        }
        if (!is_writable($target_dir_absolute)) {
             error_log("[POST Image Error] El directorio de imágenes no tiene permisos de escritura: " . $target_dir_absolute);
             http_response_code(500);
             die(json_encode(['success' => false, 'message' => 'Error interno del servidor (permisos de imagen).']));
        }

        // Validar tipo de archivo
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $imageFileType = strtolower(pathinfo($_FILES['main_image']['name'], PATHINFO_EXTENSION));
        $check = @getimagesize($_FILES['main_image']['tmp_name']);

        if (!$check || !in_array($imageFileType, $allowed_extensions)) {
             http_response_code(400);
             error_log("[POST Image Error] Archivo no es imagen válida o tipo no permitido. File: " . print_r($_FILES['main_image'], true));
             die(json_encode(['success' => false, 'message' => 'Archivo no es una imagen válida o tipo no permitido.']));
        }

        // Crear nombre de archivo único y mover
        $new_filename = uniqid('prod_' . $id . '_') . '.' . $imageFileType;
        $target_file_absolute = $target_dir_absolute . $new_filename;
        $new_image_relative_path = $target_dir_relative . $new_filename;

        if (move_uploaded_file($_FILES['main_image']['tmp_name'], $target_file_absolute)) {
            // Borrar imagen antigua
            $old_image_absolute_path = __DIR__ . '/' . $currentProduct['main_image'];
            if ($currentProduct['main_image'] && $currentProduct['main_image'] !== $new_image_relative_path && file_exists($old_image_absolute_path)) {
                 if (@unlink($old_image_absolute_path)) {
                     error_log("[POST Image Info] Imagen antigua eliminada: " . $old_image_absolute_path);
                 } else {
                     // Log si falla el borrado, pero no detener el proceso
                     error_log("[POST Image Warning] Error al intentar eliminar imagen antigua: " . $old_image_absolute_path);
                 }
            }
            $main_image_path = $new_image_relative_path;
            $image_updated = true;
        } else {
             // Error crítico si no se puede mover el archivo subido
             error_log("[POST Image Error] Error al mover archivo subido para producto ID: " . $id . " a " . $target_file_absolute . ". Check permissions and path.");
             http_response_code(500);
             die(json_encode(['success' => false, 'message' => 'Error al guardar la nueva imagen.']));
        }
    } elseif (isset($_FILES['main_image']) && $_FILES['main_image']['error'] !== UPLOAD_ERR_NO_FILE) {
         // Log de otros errores de subida
         error_log("[POST Image Error] Error en subida de imagen (código: {$_FILES['main_image']['error']}) para producto ID: " . $id);
         http_response_code(400);
         die(json_encode(['success' => false, 'message' => 'Error durante la subida de la imagen (Código: ' . $_FILES['main_image']['error'] . ')']));
    }

    // --- Actualización en la Base de Datos ---
    $params = []; // Definir fuera para logging en catch
    try {
        $sql = "UPDATE products SET
                    name = :name,
                    model = :model,
                    category_id = :category_id,
                    subcategory_id = :subcategory_id,
                    stock_option = :stock_option,
                    stock_quantity = :stock_quantity,
                    price = :price,
                    main_image = :main_image,
                    is_active = :is_active,
                    updated_at = NOW()
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $params = [
            ':name' => $name,
            ':model' => $model ?: null,
            ':category_id' => $category_id,
            ':subcategory_id' => $subcategory_id,
            ':stock_option' => $stock_option,
            ':stock_quantity' => $stock_quantity,
            ':price' => $price,
            ':main_image' => $main_image_path,
            ':is_active' => $is_active,
            ':id' => $id
        ];

        $stmt->execute($params);

        if ($stmt->rowCount() > 0 || $image_updated) {
             // --- Generación de Notificaciones ---
             try {
                 $notificationSql = "INSERT INTO notifications (message, type, created_at, product_id) VALUES (:message, :type, NOW(), :product_id)";
                 $notificationStmt = $pdo->prepare($notificationSql);
                 $notificationStmt->execute([
                     'message' => "Producto '" . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "' (ID: $id) actualizado.",
                     'type' => 'info',
                     'product_id' => $id
                 ]);
             } catch (PDOException $e) {
                 // Loggear error de notificación pero no detener
                 error_log("[POST Notification Error] Error al guardar notificación para producto ID $id: " . $e->getMessage());
             }
             // --- Fin Notificación ---

             echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);
        } else {
             // No hubo cambios detectables
             echo json_encode(['success' => true, 'message' => 'No se realizaron cambios detectables en el producto.']);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        // Log detallado del error de base de datos (¡MUY IMPORTANTE!)
        error_log("[POST DB Error] Database error updating product (ID: $id): " . $e->getMessage() . " - Code: " . $e->getCode() . " - Params: " . json_encode($params));
        // Mensaje para el cliente
        if ($e->getCode() == 23000) { // Violación de integridad (ej. UNIQUE)
             echo json_encode(['success' => false, 'message' => 'Error: Ya existe un producto con datos similares (ej. nombre o modelo único).']);
        } else {
             echo json_encode(['success' => false, 'message' => 'Error en la base de datos al actualizar. Verifique los datos o contacte al administrador.']);
        }
    }
    exit(); // Terminar después de manejar POST
}

// --- Método no permitido ---
http_response_code(405); // Method Not Allowed
error_log("[Request Error] Método no permitido: " . $_SERVER['REQUEST_METHOD']);
die(json_encode(['success' => false, 'message' => 'Método no permitido']));
?>
