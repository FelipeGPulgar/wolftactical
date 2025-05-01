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
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
        header("Access-Control-Allow-Credentials: true"); // Permitir credenciales
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

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
        $stmt_current = $pdo->prepare("SELECT name, model, category_id, subcategory_id, stock_option, stock_quantity, price, is_active, main_image FROM products WHERE id = :id");
        $stmt_current->execute(['id' => $id]);
        $current_product_data = $stmt_current->fetch(PDO::FETCH_ASSOC);
        if (!$current_product_data) { /* ... (manejo de producto no encontrado) ... */ }
    } catch (PDOException $e) { /* ... (manejo de error DB) ... */ }

    // --- Manejo de Imagen (igual que antes) ---
    $main_image_path = $current_product_data['main_image'];
    $image_updated = false;
    // ... (código de manejo de imagen sin cambios) ...
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
            $old_image_absolute_path = __DIR__ . '/' . $current_product_data['main_image'];
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
        $update_params = [ /* ... (parámetros de update) ... */
            ':name' => $name, ':model' => $model ?: null, ':category_id' => $category_id,
            ':subcategory_id' => $subcategory_id, ':stock_option' => $stock_option,
            ':stock_quantity' => $stock_quantity, ':price' => $price,
            ':main_image' => $main_image_path, ':is_active' => $is_active, ':id' => $id
        ];
        $update_executed = $stmt_update->execute($update_params);
        $rows_affected = $stmt_update->rowCount();

        // Verificar si la actualización fue exitosa o si se actualizó la imagen
        if ($update_executed && ($rows_affected > 0 || $image_updated)) {

             // *******************************************************************
             // ***** INICIO: LÓGICA PARA GENERAR UNA NOTIFICACIÓN RESUMIDA *****
             // *******************************************************************
             $change_details = []; // Array para guardar los detalles de los cambios

             // Mapeo de nombres de campo a nombres legibles y valores nuevos/antiguos
             $fields_to_check = [
                 'name' => ['label' => 'Nombre', 'old' => $current_product_data['name'], 'new' => $name],
                 'model' => ['label' => 'Modelo', 'old' => $current_product_data['model'], 'new' => $model ?: null],
                 'price' => ['label' => 'Precio', 'old' => (float)$current_product_data['price'], 'new' => $price],
                 'category_id' => ['label' => 'Categoría', 'old' => $current_product_data['category_id'], 'new' => $category_id], // Podrías mostrar nombres en lugar de IDs
                 'subcategory_id' => ['label' => 'Subcategoría', 'old' => $current_product_data['subcategory_id'], 'new' => $subcategory_id], // Podrías mostrar nombres
                 'stock_option' => ['label' => 'Opción Stock', 'old' => $current_product_data['stock_option'], 'new' => $stock_option],
                 'stock_quantity' => ['label' => 'Cantidad Stock', 'old' => $current_product_data['stock_quantity'], 'new' => $stock_quantity],
                 'is_active' => ['label' => 'Estado Activo', 'old' => (int)$current_product_data['is_active'], 'new' => $is_active]
             ];

             // Iterar para encontrar diferencias y construir los detalles
             foreach ($fields_to_check as $field_key => $field_data) {
                 $old_val = $field_data['old'];
                 $new_val = $field_data['new'];
                 $is_different = false;
                 // ... (misma lógica de comparación que antes para $is_different) ...
                 if (is_null($old_val) && !is_null($new_val)) { $is_different = true; }
                 elseif (!is_null($old_val) && is_null($new_val)) { $is_different = true; }
                 elseif (!is_null($old_val) && !is_null($new_val)) {
                     if ($field_key === 'price') { $is_different = (abs($old_val - $new_val) > 0.001); }
                     elseif ($field_key === 'is_active') { $is_different = ($old_val !== $new_val); }
                     else { $is_different = ($old_val !== $new_val); }
                 }

                 if ($is_different) {
                     // Formatear valores para mostrar (manejar NULL y booleanos para 'is_active')
                     if ($field_key === 'is_active') {
                         $old_display = $old_val ? 'Activo' : 'Inactivo';
                         $new_display = $new_val ? 'Activo' : 'Inactivo';
                     } else {
                         $old_display = is_null($old_val) ? 'N/A' : htmlspecialchars((string)$old_val, ENT_QUOTES, 'UTF-8');
                         $new_display = is_null($new_val) ? 'N/A' : htmlspecialchars((string)$new_val, ENT_QUOTES, 'UTF-8');
                     }
                     // Añadir detalle al array de cambios
                     $change_details[] = "{$field_data['label']}: '{$old_display}' -> '{$new_display}'";
                 }
             } // Fin del bucle foreach

             // Añadir detalle si la imagen cambió
             if ($image_updated) {
                 $change_details[] = "Imagen principal actualizada";
             }

             // Si hubo algún cambio (en campos o imagen), crear UNA notificación
             if (!empty($change_details)) {
                 $notificationParams = []; // Para logging
                 try {
                     // Construir el mensaje final
                     $final_message = "Producto '" . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "' (ID: $id) actualizado:\n- " . implode("\n- ", $change_details);

                     // Preparar la consulta INSERT (solo una vez)
                     $notificationSql = "INSERT INTO notifications
                                           (product_id, message, field_changed, old_value, new_value, type, created_at)
                                         VALUES
                                           (:product_id, :message, :field_changed, :old_value, :new_value, :type, NOW())";
                     $notificationStmt = $pdo->prepare($notificationSql);

                     // Definir los parámetros para la notificación resumida
                     $notificationParams = [
                         ':product_id' => $id,
                         ':message' => $final_message, // El mensaje con todos los detalles
                         ':field_changed' => null,     // No aplica para el resumen
                         ':old_value' => null,         // No aplica para el resumen
                         ':new_value' => null,         // No aplica para el resumen
                         ':type' => 'success'          // Tipo válido
                     ];

                     // Ejecutar la inserción
                     $notificationStmt->execute($notificationParams);
                     error_log("[POST Notification Info] Notificación RESUMIDA creada para producto ID $id.");

                 } catch (PDOException $e) {
                     // Loggear error detallado si falla la inserción de la notificación resumida
                     error_log("[POST Notification Error] Error al guardar notificación RESUMIDA para producto ID $id: " . $e->getMessage() . " - Params: " . json_encode($notificationParams ?? []));
                 }
             } else {
                 // Si $rows_affected > 0 pero no detectamos cambios específicos (raro, pero posible)
                 error_log("[POST Info] Se afectaron filas pero no se detectaron cambios específicos ni de imagen para ID $id.");
             }

             // *****************************************************************
             // ***** FIN: LÓGICA PARA GENERAR UNA NOTIFICACIÓN RESUMIDA *****
             // *****************************************************************

             // Respuesta de éxito general para la actualización del producto
             echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);

        } else if ($update_executed && $rows_affected === 0 && !$image_updated) {
             // La consulta se ejecutó bien, pero no cambió nada
             error_log("[POST Info] No se realizaron cambios detectables para producto ID $id.");
             echo json_encode(['success' => true, 'message' => 'No se realizaron cambios detectables en el producto.']);
        } else {
             // La ejecución del UPDATE falló
             $errorInfo = $stmt_update->errorInfo();
             error_log("[POST DB Error] Falló la ejecución del UPDATE para producto ID $id: " . ($errorInfo[2] ?? 'Unknown error'));
             http_response_code(500);
             echo json_encode(['success' => false, 'message' => 'Error al ejecutar la actualización del producto.']);
        }

    } catch (PDOException $e) { /* ... (manejo de error DB principal) ... */ }
    exit(); // Terminar después de manejar POST
}

// --- Método no permitido ---
http_response_code(405); // Method Not Allowed
error_log("[Request Error] Método no permitido: " . $_SERVER['REQUEST_METHOD']);
die(json_encode(['success' => false, 'message' => 'Método no permitido']));
?>
