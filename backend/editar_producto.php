<?php
// File: backend/editar_producto.php

// --- INICIO: Habilitar TODOS los errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1); // Cambiar a 0 en producción
ini_set('log_errors', 1); // Asegúrate de que los errores se registren
// Considera especificar un archivo de log: ini_set('error_log', '/Applications/XAMPP/logs/php_error_log'); // Ajusta la ruta si es necesario
// --- FIN: Depuración ---

session_start();

// --- Configuración CORS ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin"); // Importante para caché
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Valor predeterminado seguro
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// --- Manejo OPTIONS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Conexión DB y Autenticación ---
require_once 'db.php'; // Asegúrate que $pdo se define aquí

// Verifica la sesión DESPUÉS de incluir db.php y ANTES de cualquier salida principal
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header("Content-Type: application/json"); // Establecer ANTES de la salida
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'No autorizado']));
}

// --- Establecer Content-Type JSON para respuestas reales ---
header("Content-Type: application/json");

// --- Manejo de solicitud GET ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // ... (El código para GET no necesita cambios, se mantiene igual que antes) ...
    $productId = $_GET['id'] ?? null;

    if (!$productId || !filter_var($productId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])) {
        http_response_code(400);
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
            error_log("[GET Info] Producto no encontrado con ID: " . $productId);
            die(json_encode(['success' => false, 'message' => 'Producto no encontrado con ID: ' . $productId]));
        }

        // 2. Obtener todas las categorías PRINCIPALES
        $catStmt = $pdo->query("SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name");
        if (!$catStmt) {
             throw new PDOException("Error crítico al obtener categorías principales.");
        }
        $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Obtener subcategorías de la categoría ACTUAL del producto
        $subcategories = [];
        $categoryIdToFetchSubcategories = $product['category_id'] ?? null;

        if ($categoryIdToFetchSubcategories) {
             $subStmt = $pdo->prepare("SELECT id, name FROM categories WHERE parent_id = :category_id ORDER BY name");
             if ($subStmt) {
                 $subStmt->execute([':category_id' => $categoryIdToFetchSubcategories]);
                 $subcategories = $subStmt->fetchAll(PDO::FETCH_ASSOC);
             } else {
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
        error_log("[GET DB Error] Error fetching product data for ID $productId: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor al obtener datos del producto.']);
    }
    exit();
}


// --- Manejo de solicitud POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener datos del POST
    $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_SPECIAL_CHARS);
    $model = filter_input(INPUT_POST, 'model', FILTER_SANITIZE_SPECIAL_CHARS);
    $category_id = filter_input(INPUT_POST, 'main_category', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $subcategory_id_input = filter_input(INPUT_POST, 'subcategory', FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $subcategory_id = ($subcategory_id_input === false || $subcategory_id_input === null) ? null : $subcategory_id_input;
    $stock_option = $_POST['stock_option'] ?? 'preorder';
    $stock_quantity_input = $_POST['stock_quantity'] ?? null;
    $price_input = $_POST['price'] ?? null;
    $is_active = isset($_POST['is_active']) ? 1 : 0;

    // --- Validación de Datos (igual que antes) ---
    if ($id === false || $id === null) { /* ... */ die(json_encode(['success' => false, 'message' => 'ID de producto inválido...'])); }
    if (empty($name) || $price_input === null || $category_id === false || $category_id === null) { /* ... */ die(json_encode(['success' => false, 'message' => 'Nombre, precio y categoría...'])); }
    if (!is_numeric($price_input) || (float)$price_input < 0) { /* ... */ die(json_encode(['success' => false, 'message' => 'El precio debe ser...'])); }
    $price = (float)$price_input;
    $stock_quantity = null;
    if ($stock_option === 'instock') {
        if ($stock_quantity_input === null || $stock_quantity_input === '' || filter_var($stock_quantity_input, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) === false) { /* ... */ die(json_encode(['success' => false, 'message' => 'La cantidad en stock debe ser...'])); }
        $stock_quantity = (int)$stock_quantity_input;
    }

    // --- Obtener TODOS los datos actuales del producto ANTES de actualizar ---
    $current_product_data = null;
    try {
        // Selecciona todos los campos que quieres rastrear para notificaciones
        $stmt_current = $pdo->prepare("SELECT name, model, category_id, subcategory_id, stock_option, stock_quantity, price, is_active, main_image FROM products WHERE id = :id");
        $stmt_current->execute(['id' => $id]);
        $current_product_data = $stmt_current->fetch(PDO::FETCH_ASSOC);

        if (!$current_product_data) {
            http_response_code(404);
            error_log("[POST Info] Producto no encontrado para actualizar con ID: " . $id);
            die(json_encode(['success' => false, 'message' => 'Producto no encontrado para actualizar']));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("[POST DB Error] Error fetching current full product data (ID: $id): " . $e->getMessage());
        die(json_encode(['success' => false, 'message' => 'Error al obtener datos actuales del producto.']));
    }

    // --- Manejo de Imagen (igual que antes) ---
    $main_image_path = $current_product_data['main_image']; // Usar dato obtenido
    $image_updated = false;
    // ... (resto del código de manejo de imagen sin cambios) ...
    if (isset($_FILES['main_image']) && $_FILES['main_image']['error'] === UPLOAD_ERR_OK && !empty($_FILES['main_image']['tmp_name'])) {
        $target_dir_relative = "uploads/";
        $target_dir_absolute = __DIR__ . '/' . $target_dir_relative;

        if (!is_dir($target_dir_absolute)) { /* ... */ }
        if (!is_writable($target_dir_absolute)) { /* ... */ }

        $allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $_FILES['main_image']['tmp_name']);
        finfo_close($finfo);
        $file_extension = strtolower(pathinfo($_FILES['main_image']['name'], PATHINFO_EXTENSION));
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($mime_type, $allowed_mime_types) || !in_array($file_extension, $allowed_extensions)) { /* ... */ }

        $new_filename = uniqid('prod_' . $id . '_', true) . '.' . $file_extension;
        $target_file_absolute = $target_dir_absolute . $new_filename;
        $new_image_relative_path = $target_dir_relative . $new_filename;

        if (move_uploaded_file($_FILES['main_image']['tmp_name'], $target_file_absolute)) {
            $old_image_absolute_path = __DIR__ . '/' . $current_product_data['main_image']; // Usar dato obtenido
            if (!empty($current_product_data['main_image']) && $current_product_data['main_image'] !== $new_image_relative_path && file_exists($old_image_absolute_path)) {
                 if (@unlink($old_image_absolute_path)) { /* ... */ } else { /* ... */ }
            }
            $main_image_path = $new_image_relative_path;
            $image_updated = true;
        } else { /* ... */ }
    } elseif (isset($_FILES['main_image']) && $_FILES['main_image']['error'] !== UPLOAD_ERR_NO_FILE) { /* ... */ }


    // --- Actualización en la Base de Datos (igual que antes) ---
    $update_params = [];
    try {
        $sql_update = "UPDATE products SET
                    name = :name, model = :model, category_id = :category_id, subcategory_id = :subcategory_id,
                    stock_option = :stock_option, stock_quantity = :stock_quantity, price = :price,
                    main_image = :main_image, is_active = :is_active, updated_at = NOW()
                WHERE id = :id";

        $stmt_update = $pdo->prepare($sql_update);
        $update_params = [
            ':name' => $name, ':model' => $model ?: null, ':category_id' => $category_id,
            ':subcategory_id' => $subcategory_id, ':stock_option' => $stock_option,
            ':stock_quantity' => $stock_quantity, ':price' => $price,
            ':main_image' => $main_image_path, ':is_active' => $is_active, ':id' => $id
        ];
        $update_executed = $stmt_update->execute($update_params);
        $rows_affected = $stmt_update->rowCount();

        // Verificar si la actualización fue exitosa o si se actualizó la imagen
        if ($update_executed && ($rows_affected > 0 || $image_updated)) {

             // ************************************************************
             // ***** INICIO: NUEVA LÓGICA DE NOTIFICACIONES DETALLADAS *****
             // ************************************************************
             $changes_detected = false; // Flag para saber si hubo algún cambio notificable
             $notificationParams = []; // Para logging en catch

             // Mapeo de nombres de campo a nombres legibles y valores nuevos/antiguos
             $fields_to_check = [
                 'name' => ['label' => 'Nombre', 'old' => $current_product_data['name'], 'new' => $name],
                 'model' => ['label' => 'Modelo', 'old' => $current_product_data['model'], 'new' => $model ?: null], // Asegurar NULL si está vacío
                 'price' => ['label' => 'Precio', 'old' => (float)$current_product_data['price'], 'new' => $price], // Comparar como float
                 'category_id' => ['label' => 'Categoría', 'old' => $current_product_data['category_id'], 'new' => $category_id],
                 'subcategory_id' => ['label' => 'Subcategoría', 'old' => $current_product_data['subcategory_id'], 'new' => $subcategory_id],
                 'stock_option' => ['label' => 'Opción Stock', 'old' => $current_product_data['stock_option'], 'new' => $stock_option],
                 'stock_quantity' => ['label' => 'Cantidad Stock', 'old' => $current_product_data['stock_quantity'], 'new' => $stock_quantity], // Ya es NULL si no aplica
                 'is_active' => ['label' => 'Estado Activo', 'old' => (int)$current_product_data['is_active'], 'new' => $is_active] // Comparar como int
             ];

             // Preparar la consulta INSERT UNA SOLA VEZ
             $notificationSql = "INSERT INTO notifications
                                   (product_id, message, field_changed, old_value, new_value, type, created_at)
                                 VALUES
                                   (:product_id, :message, :field_changed, :old_value, :new_value, :type, NOW())";
             $notificationStmt = $pdo->prepare($notificationSql);

             // Iterar sobre los campos a verificar
             foreach ($fields_to_check as $field_key => $field_data) {
                 $old_val = $field_data['old'];
                 $new_val = $field_data['new'];

                 // Comparación cuidadosa (manejo de NULL y tipos)
                 $is_different = false;
                 if (is_null($old_val) && !is_null($new_val)) {
                     $is_different = true;
                 } elseif (!is_null($old_val) && is_null($new_val)) {
                     $is_different = true;
                 } elseif (!is_null($old_val) && !is_null($new_val)) {
                     // Si ambos no son null, comparar estrictamente
                     if ($field_key === 'price') { // Comparación específica para precio (float)
                         $is_different = (abs($old_val - $new_val) > 0.001); // Usar tolerancia para floats
                     } elseif ($field_key === 'is_active') { // Comparación específica para estado (int)
                          $is_different = ($old_val !== $new_val);
                     }
                     else { // Comparación estándar para strings, ints, etc.
                         $is_different = ($old_val !== $new_val);
                     }
                 }
                 // Si ambos son null, no son diferentes

                 if ($is_different) {
                     $changes_detected = true; // Marcar que hubo al menos un cambio
                     try {
                         // Formatear valores para el mensaje y la DB (manejar NULL)
                         $old_display = is_null($old_val) ? 'N/A' : htmlspecialchars((string)$old_val, ENT_QUOTES, 'UTF-8');
                         $new_display = is_null($new_val) ? 'N/A' : htmlspecialchars((string)$new_val, ENT_QUOTES, 'UTF-8');
                         $message = "{$field_data['label']} cambiado de '{$old_display}' a '{$new_display}' (Producto ID: $id)";

                         // Definir los parámetros para ESTA notificación específica
                         $notificationParams = [
                             ':product_id' => $id,
                             ':message' => $message,
                             ':field_changed' => $field_key, // Nombre de la columna que cambió
                             ':old_value' => is_null($old_val) ? null : (string)$old_val, // Guardar como string o null
                             ':new_value' => is_null($new_val) ? null : (string)$new_val, // Guardar como string o null
                             ':type' => 'success' // Tipo válido según tu ENUM
                         ];

                         // Ejecutar la inserción
                         $notificationStmt->execute($notificationParams);
                         error_log("[POST Notification Info] Notificación de cambio '{$field_key}' creada para producto ID $id.");

                     } catch (PDOException $e) {
                         // Loggear error detallado de esta notificación específica
                         error_log("[POST Notification Error] Error al guardar notificación de cambio '{$field_key}' para producto ID $id: " . $e->getMessage() . " - Params: " . json_encode($notificationParams ?? []));
                         // No detener el script por un error de notificación
                     }
                 }
             } // Fin del bucle foreach

             // Si no se detectó ningún cambio en los campos rastreados, pero sí se actualizó la imagen
             if (!$changes_detected && $image_updated) {
                 try {
                     $message = "Imagen principal actualizada (Producto ID: $id)";
                     $notificationParams = [
                         ':product_id' => $id,
                         ':message' => $message,
                         ':field_changed' => 'main_image', // Indicar que cambió la imagen
                         ':old_value' => $current_product_data['main_image'], // Ruta antigua
                         ':new_value' => $main_image_path, // Ruta nueva
                         ':type' => 'success'
                     ];
                     $notificationStmt->execute($notificationParams);
                     error_log("[POST Notification Info] Notificación de cambio de imagen creada para producto ID $id.");
                 } catch (PDOException $e) {
                      error_log("[POST Notification Error] Error al guardar notificación de cambio de imagen para producto ID $id: " . $e->getMessage() . " - Params: " . json_encode($notificationParams ?? []));
                 }
             } elseif (!$changes_detected && !$image_updated) {
                 // Esto no debería pasar si $rows_affected > 0, pero por si acaso
                 error_log("[POST Info] Se afectaron filas pero no se detectaron cambios específicos ni de imagen para ID $id.");
             }

             // **********************************************************
             // ***** FIN: NUEVA LÓGICA DE NOTIFICACIONES DETALLADAS *****
             // **********************************************************

             // Respuesta de éxito general para la actualización del producto
             echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);

        } else if ($update_executed && $rows_affected === 0 && !$image_updated) {
             // La consulta se ejecutó bien, pero no cambió nada (y no se subió imagen)
             error_log("[POST Info] No se realizaron cambios detectables para producto ID $id.");
             echo json_encode(['success' => true, 'message' => 'No se realizaron cambios detectables en el producto.']);
        } else {
             // La ejecución del UPDATE falló por alguna razón no capturada por PDOException
             $errorInfo = $stmt_update->errorInfo();
             error_log("[POST DB Error] Falló la ejecución del UPDATE para producto ID $id: " . ($errorInfo[2] ?? 'Unknown error'));
             http_response_code(500);
             echo json_encode(['success' => false, 'message' => 'Error al ejecutar la actualización del producto.']);
        }

    } catch (PDOException $e) {
        // Captura errores durante la preparación o ejecución del UPDATE principal
        http_response_code(500);
        error_log("[POST DB Error] Database error updating product (ID: $id): " . $e->getMessage() . " - Code: " . $e->getCode() . " - Params: " . json_encode($update_params));
        if ($e->getCode() == 23000) {
             echo json_encode(['success' => false, 'message' => 'Error: Ya existe un producto con datos similares (ej. nombre o modelo que debe ser único).']);
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
