<?php
// --- INICIO: Habilitar errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1); // ¡MUY IMPORTANTE! Cambiar a 0 en producción
ini_set('log_errors', 1);
// --- FIN: Depuración ---

session_start(); // Mantener por si acaso

// --- Configuración CORS (consistente) ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // O null para bloquear
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Manejo OPTIONS (preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php'; // Asegúrate que $pdo se define aquí

try {
    // --- Determinar qué se está solicitando ---
    $productId = $_GET['id'] ?? null;
    $categoryName = $_GET['category'] ?? null;
    $subcategoryName = $_GET['subcategory'] ?? null;

    // --- Validación básica de parámetros ---
    if ($productId !== null && !filter_var($productId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'ID de producto inválido.']));
    }
    $productId = $productId ? (int)$productId : null; // Convertir a int si no es null

    // --- Construcción de la Consulta SQL ---
    // Seleccionamos todas las columnas de products (p.*)
    // y opcionalmente los nombres de categoría/subcategoría para referencia
    $sql = "SELECT p.*, c_main.name AS category_name, c_sub.name AS subcategory_name
            FROM products p ";
    $params = [];
    $conditions = [];
    $joins = ""; // String para almacenar los JOINs necesarios

    // Añadir condición para productos activos (¡ASEGÚRATE QUE LA COLUMNA is_active EXISTA!)
    $conditions[] = "p.is_active = 1"; // Asumimos que siempre queremos solo activos

    if ($productId !== null) {
        // --- Obtener un solo producto por ID ---
        $conditions[] = "p.id = :id";
        $params[':id'] = $productId;
        // No necesitamos joins específicos aquí, pero los dejamos por si acaso
        $joins .= " LEFT JOIN categories c_main ON p.category_id = c_main.id ";
        $joins .= " LEFT JOIN categories c_sub ON p.subcategory_id = c_sub.id ";

    } elseif ($subcategoryName !== null) {
        // --- Obtener productos por NOMBRE de SUBCATEGORÍA ---
        // Necesitamos unir con la tabla categories para filtrar por nombre de subcategoría
        $joins .= " INNER JOIN categories c_sub ON p.subcategory_id = c_sub.id ";
        $conditions[] = "c_sub.name = :subcategory_name";
        $params[':subcategory_name'] = $subcategoryName;

        // Opcional: Si también se proporciona el nombre de la categoría principal, añadir otro join y condición
        if ($categoryName !== null) {
            // Asegurarnos que la subcategoría pertenece a la categoría principal correcta
            // (Asumiendo que category_id en products es el ID de la categoría principal)
            $joins .= " INNER JOIN categories c_main ON p.category_id = c_main.id "; // O podría ser c_sub.parent_id = c_main.id
            $conditions[] = "c_main.name = :category_name";
            $params[':category_name'] = $categoryName;
        } else {
             // Si no se da categoría principal, añadimos el join para obtener su nombre
             $joins .= " LEFT JOIN categories c_main ON p.category_id = c_main.id ";
        }

    } elseif ($categoryName !== null) {
        // --- Obtener productos por NOMBRE de CATEGORÍA PRINCIPAL ---
        // Necesitamos unir con la tabla categories para filtrar por nombre de categoría principal
        $joins .= " INNER JOIN categories c_main ON p.category_id = c_main.id ";
        $conditions[] = "c_main.name = :category_name";
        $params[':category_name'] = $categoryName;
        // Añadimos join para obtener nombre de subcategoría si existe
        $joins .= " LEFT JOIN categories c_sub ON p.subcategory_id = c_sub.id ";

    } else {
        // --- Obtener TODOS los productos (activos) ---
        // Añadimos joins para obtener nombres de categoría/subcategoría
        $joins .= " LEFT JOIN categories c_main ON p.category_id = c_main.id ";
        $joins .= " LEFT JOIN categories c_sub ON p.subcategory_id = c_sub.id ";
    }

    // Combinar SQL, Joins y Condiciones
    $sql .= $joins; // Añadir los joins
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(' AND ', $conditions);
    }

    // Opcional: Añadir ordenación
    $sql .= " ORDER BY p.name ASC"; // Ordenar por nombre de producto, por ejemplo

    // --- Preparar y Ejecutar ---
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // --- Procesar Resultados ---
    if ($productId !== null) {
        // Si buscamos por ID, esperamos un solo resultado
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado o inactivo']);
        } else {
            // Aquí podrías añadir lógica para obtener imágenes adicionales si es necesario
            echo json_encode(['success' => true, 'data' => $product]);
        }
    } else {
        // Si buscamos por categoría/subcategoría o todos, esperamos una lista
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Aquí podrías iterar sobre $products para añadir imágenes adicionales si es necesario
        echo json_encode(['success' => true, 'data' => $products]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    // Loggear el error real para depuración interna
    error_log('Database Error in get_products.php: ' . $e->getMessage() . " SQL: " . ($sql ?? 'N/A') . " Params: " . json_encode($params ?? []));
    echo json_encode([
        'success' => false,
        'message' => 'Error en la base de datos al obtener productos.'
        // 'debug_message' => 'DB Error: ' . $e->getMessage() // Solo para desarrollo
    ]);
} catch (Exception $e) {
    http_response_code(500);
    // Loggear el error real
    error_log('General Error in get_products.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ocurrió un error inesperado.'
        // 'debug_message' => 'Error: ' . $e->getMessage() // Solo para desarrollo
    ]);
}
exit(); // Terminar script explícitamente
?>
