<?php
// --- INICIO: Añadir para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
// --- FIN: Añadir para depuración ---

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
// Establecer Content-Type JSON solo si no hay error PHP antes
// header("Content-Type: application/json"); // Movido más abajo

// --- Manejo OPTIONS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Asegurar Content-Type JSON para la respuesta OPTIONS si es necesario, aunque usualmente no lleva cuerpo
    header("Content-Type: application/json");
    http_response_code(200);
    exit();
}

// --- Conexión DB y Autenticación ---
// Asegúrate que la ruta a db.php sea correcta desde este archivo
require_once 'db.php'; // Si esto falla, el error se mostrará ahora

// Verifica la sesión DESPUÉS de incluir db.php
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) { // Añadida verificación estricta
    // Establecer Content-Type antes de enviar el cuerpo JSON del error
    header("Content-Type: application/json");
    http_response_code(401);
    // Usar die() o exit() es buena práctica después de enviar respuesta de error
    die(json_encode(['success' => false, 'message' => 'No autorizado']));
}

// --- Establecer Content-Type JSON ahora que sabemos que no hubo errores básicos ---
header("Content-Type: application/json");

// --- Manejo de solicitud GET ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $productId = $_GET['id'] ?? null;

    // Añadir validación si el ID es numérico y positivo
    if (!$productId || !filter_var($productId, FILTER_VALIDATE_INT) || (int)$productId <= 0) {
        http_response_code(400);
        // Usar die() o exit()
        die(json_encode(['success' => false, 'message' => 'ID de producto inválido o no proporcionado']));
    }
    $productId = (int)$productId; // Convertir a entero

    try {
        // 1. Obtener datos del producto
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = :id");
        $stmt->execute([':id' => $productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si no se encuentra el producto
        if (!$product) {
            http_response_code(404);
            die(json_encode(['success' => false, 'message' => 'Producto no encontrado con ID: ' . $productId]));
        }

        // 2. Obtener todas las categorías principales
        // Ajusta la consulta si es necesario (ej. `WHERE parent_id IS NULL`)
        $catStmt = $pdo->query("SELECT id, name FROM categories ORDER BY name"); // Asume tabla 'categories'
        if (!$catStmt) {
             // Lanza una excepción si la consulta de categorías falla
             throw new PDOException("Error crítico al obtener categorías.");
        }
        $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Obtener subcategorías de la categoría actual del producto
        $subcategories = [];
        // Prioriza category_id si existe en la tabla products
        $categoryIdToFetchSubcategories = $product['category_id'] ?? null; // Asume columna category_id

        // Fallback si solo tienes el nombre de la categoría en products (menos recomendado)
        if (!$categoryIdToFetchSubcategories && !empty($product['category'])) {
             $catIdStmt = $pdo->prepare("SELECT id FROM categories WHERE name = :name");
             $catIdStmt->execute([':name' => $product['category']]);
             $categoryIdToFetchSubcategories = $catIdStmt->fetchColumn();
        }

        // Si se encontró un ID de categoría, busca sus subcategorías
        if ($categoryIdToFetchSubcategories) {
             // Asegúrate que la tabla 'subcategories' y la columna 'category_id' existan
             $subStmt = $pdo->prepare("SELECT id, name FROM subcategories WHERE category_id = :category_id ORDER BY name");
             $subStmt->execute([':category_id' => $categoryIdToFetchSubcategories]);
             if ($subStmt) { // Verifica si la preparación fue exitosa
                 $subcategories = $subStmt->fetchAll(PDO::FETCH_ASSOC);
             } else {
                 // Loggea una advertencia pero no detengas el script si falla la carga de subcategorías
                 error_log("Advertencia: No se pudieron preparar subcategorías para category_id: " . $categoryIdToFetchSubcategories);
             }
        }

        // 4. Devolver la respuesta JSON combinada
        echo json_encode([
            'success' => true,
            'product' => $product,
            'categories' => $categories,
            'subcategories' => $subcategories // Puede ser un array vacío si no hay o no se encontraron
        ]);

    } catch (PDOException $e) {
        // Captura errores de base de datos durante el proceso GET
        http_response_code(500);
        // Loggea el error real para el administrador del servidor
        error_log("Error fetching product data (GET) for ID $productId: " . $e->getMessage());
        // Devuelve un mensaje genérico al cliente
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor al obtener datos del producto.']);
    }
    // Terminar el script después de manejar GET
    exit();
}


// --- Manejo de solicitud POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener datos del POST
    $id = $_POST['id'] ?? null;
    $name = $_POST['name'] ?? '';
    $model = $_POST['model'] ?? '';
    // Asegúrate que el frontend envía 'main_category' y 'subcategory' como IDs
    $category_id = !empty($_POST['main_category']) ? (int)$_POST['main_category'] : null;
    $subcategory_id = !empty($_POST['subcategory']) ? (int)$_POST['subcategory'] : null;
    $stock_option = $_POST['stock_option'] ?? 'preorder';
    // Asegurarse que stock_quantity sea entero o null
    $stock_quantity = ($stock_option === 'instock' && isset($_POST['stock_quantity']) && $_POST['stock_quantity'] !== '') ? (int)$_POST['stock_quantity'] : null;
    $price = $_POST['price'] ?? '';
    // Asegúrate que el checkbox 'is_active' envíe un valor (ej. 1 cuando está marcado)
    $is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 0; // Default a 0 (inactivo) si no se envía

    // Validación de ID
    if (!$id || !filter_var($id, FILTER_VALIDATE_INT) || (int)$id <= 0) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'ID de producto inválido o no proporcionado']));
    }
    $id = (int)$id;

    // Obtener producto actual para comparación y manejo de imagen
    try {
        $currentProductStmt = $pdo->prepare("SELECT * FROM products WHERE id = :id");
        $currentProductStmt->execute(['id' => $id]);
        $currentProduct = $currentProductStmt->fetch(PDO::FETCH_ASSOC);
        if (!$currentProduct) {
            http_response_code(404);
            die(json_encode(['success' => false, 'message' => 'Producto no encontrado para actualizar']));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching current product (POST): " . $e->getMessage());
        die(json_encode(['success' => false, 'message' => 'Error al verificar producto existente.']));
    }


    // --- Manejo de Imagen ---
    $main_image_path = $currentProduct['main_image']; // Mantener imagen actual por defecto

    // Verifica si se subió un archivo, no hay errores y tiene un nombre temporal
    if (isset($_FILES['main_image']) && $_FILES['main_image']['error'] === UPLOAD_ERR_OK && !empty($_FILES['main_image']['tmp_name'])) {

        $target_dir = "imagenes/"; // Ruta relativa desde este script PHP
        // Asegúrate que el directorio exista y tenga permisos de escritura
        if (!is_dir($target_dir)) {
            // Intenta crear el directorio recursivamente
            if (!mkdir($target_dir, 0775, true)) { // Usar permisos más seguros que 0777
                error_log("Error crítico: No se pudo crear el directorio de imágenes: " . $target_dir);
                http_response_code(500);
                die(json_encode(['success' => false, 'message' => 'Error interno del servidor al preparar almacenamiento de imagen.']));
            }
        }
        // Verifica si se puede escribir en el directorio después de intentar crearlo
        if (!is_writable($target_dir)) {
             error_log("Error crítico: El directorio de imágenes no tiene permisos de escritura: " . $target_dir);
             http_response_code(500);
             die(json_encode(['success' => false, 'message' => 'Error interno del servidor (permisos de imagen).']));
        }


        // Validar tipo de archivo (ejemplo básico)
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $imageFileType = strtolower(pathinfo($_FILES['main_image']['name'], PATHINFO_EXTENSION));
        // Verifica si es una imagen real y si la extensión está permitida
        $check = @getimagesize($_FILES['main_image']['tmp_name']); // Usar @ para suprimir warnings si no es imagen

        if (!$check || !in_array($imageFileType, $allowed_extensions)) {
             http_response_code(400);
             die(json_encode(['success' => false, 'message' => 'Archivo no es una imagen válida o tipo no permitido.']));
        }

        // Crear nombre de archivo único para evitar colisiones
        $new_filename = uniqid('prod_' . $id . '_') . '.' . $imageFileType;
        $target_file = $target_dir . $new_filename;

        // Mover archivo subido al directorio de destino
        if (move_uploaded_file($_FILES['main_image']['tmp_name'], $target_file)) {
            // Borrar imagen antigua si existe, es diferente y se puede acceder
            if ($currentProduct['main_image'] && $currentProduct['main_image'] !== $target_file && file_exists($currentProduct['main_image'])) {
                 @unlink($currentProduct['main_image']); // Suprimir errores si no se puede borrar
            }
            $main_image_path = $target_file; // Usar la nueva ruta relativa
        } else {
             // Error al mover el archivo
             error_log("Error al mover archivo subido para producto ID: " . $id . " a " . $target_file);
             http_response_code(500);
             die(json_encode(['success' => false, 'message' => 'Error al guardar la nueva imagen.']));
        }
    } elseif (isset($_FILES['main_image']) && $_FILES['main_image']['error'] !== UPLOAD_ERR_NO_FILE) {
         // Si se intentó subir pero hubo un error diferente a "no se subió archivo"
         error_log("Error en subida de imagen (código: {$_FILES['main_image']['error']}) para producto ID: " . $id);
         http_response_code(400);
         die(json_encode(['success' => false, 'message' => 'Error durante la subida de la imagen (Código: ' . $_FILES['main_image']['error'] . ')']));
    }
    // Si no se subió archivo nuevo, $main_image_path mantiene el valor anterior

    // --- Actualización en la Base de Datos ---
    try {
        // Asegúrate que los nombres de columna (category_id, subcategory_id) existan en tu tabla 'products'
        $sql = "UPDATE products SET
                    name = :name,
                    model = :model,
                    category_id = :category_id,
                    subcategory_id = :subcategory_id,
                    stock_option = :stock_option,
                    stock_quantity = :stock_quantity,
                    price = :price,
                    main_image = :main_image,
                    is_active = :is_active
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        // Validar y preparar parámetros
        $params = [
            ':name' => $name,
            ':model' => $model ?: null, // Permitir modelo vacío como NULL
            ':category_id' => $category_id, // Ya es null si no se envió
            ':subcategory_id' => $subcategory_id, // Ya es null si no se envió
            ':stock_option' => $stock_option,
            ':stock_quantity' => $stock_quantity, // Ya es null si no aplica
            ':price' => $price,
            ':main_image' => $main_image_path, // Ruta de imagen (nueva o antigua)
            ':is_active' => $is_active,
            ':id' => $id
        ];

        $stmt->execute($params);

        // Verifica si realmente se modificó alguna fila
        if ($stmt->rowCount() > 0) {
             // --- Generación de Notificaciones (Opcional) ---
             try {
                 $notificationSql = "INSERT INTO notifications (message, type, created_at) VALUES (:message, :type, NOW())";
                 $notificationStmt = $pdo->prepare($notificationSql);
                 $notificationStmt->execute([
                     'message' => "Producto '$name' (ID: $id) actualizado.",
                     'type' => 'info' // o 'success'
                 ]);
             } catch (PDOException $e) {
                 // Loggear error de notificación pero no detener el flujo principal
                 error_log("Error al guardar notificación para producto ID $id: " . $e->getMessage());
             }
             // --- Fin Notificación ---

             echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);
        } else {
             // Si rowCount es 0, puede ser que no hubo cambios reales
             echo json_encode(['success' => true, 'message' => 'No se realizaron cambios detectables en el producto.']);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        // Loggear el error real es crucial
        error_log("Database error updating product (POST): " . $e->getMessage() . " Params: " . json_encode($params));
        // Mensaje más específico si es posible (ej. error de duplicado)
        if ($e->getCode() == 23000) { // Código de error SQL para violación de integridad (ej. UNIQUE)
             echo json_encode(['success' => false, 'message' => 'Error: Ya existe un producto con datos similares (ej. nombre o modelo).']);
        } else {
             echo json_encode(['success' => false, 'message' => 'Error en la base de datos al actualizar. Verifique los datos.']);
        }
    }
    exit(); // Terminar después de manejar POST
}

// --- Método no permitido ---
// Si el script llega aquí, significa que no fue GET, POST ni OPTIONS
http_response_code(405); // Method Not Allowed
die(json_encode(['success' => false, 'message' => 'Método no permitido'])); // Usar die()
?>
