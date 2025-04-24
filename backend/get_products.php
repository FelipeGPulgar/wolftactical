<?php
session_start(); // Aunque no se use para autenticación aquí, puede ser útil mantenerla si otras partes la necesitan.

// Configuración de CORS (consistente con otros archivos)
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Considera si un valor predeterminado es seguro o si deberías bloquear orígenes no permitidos.
    // Puedes cambiar 'http://localhost:3000' por null si prefieres bloquear orígenes desconocidos.
    header("Access-Control-Allow-Origin: http://localhost:3000");
}

header("Access-Control-Allow-Methods: GET, OPTIONS"); // Solo GET y OPTIONS son necesarios aquí
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Manejar solicitud OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {
    // Determinar qué se está solicitando
    $productId = $_GET['id'] ?? null;
    $categoryName = $_GET['category'] ?? null;
    $subcategoryName = $_GET['subcategory'] ?? null;

    // --- Validación básica de parámetros ---
    // Si se proporciona un ID, debe ser numérico
    if ($productId !== null && !filter_var($productId, FILTER_VALIDATE_INT)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de producto inválido.']);
        exit();
    }
    // Podrías añadir validaciones similares para categoryName y subcategoryName si es necesario (ej. longitud, caracteres permitidos)


    $sql = "SELECT * FROM products"; // Selecciona todas las columnas por defecto
    $params = [];
    $conditions = [];

    if ($productId !== null) {
        // --- Obtener un solo producto por ID ---
        $conditions[] = "id = :id";
        $params[':id'] = intval($productId); // Asegura que sea un entero

    } elseif ($subcategoryName !== null) {
        // --- Obtener productos por SUBCATEGORÍA ---
        // Asumiendo que tienes una columna 'subcategory' que coincide con el nombre
        $conditions[] = "subcategory = :subcategory";
        $params[':subcategory'] = $subcategoryName;
        // Opcional: si quieres asegurarte que también pertenece a la categoría padre correcta
        // if ($categoryName !== null) {
        //     $conditions[] = "category = :category";
        //     $params[':category'] = $categoryName;
        // }

    } elseif ($categoryName !== null) {
        // --- Obtener productos por CATEGORÍA (incluyendo todas sus subcategorías) ---
        // Asumiendo que tienes una columna 'category' que coincide con el nombre
        $conditions[] = "category = :category";
        $params[':category'] = $categoryName;

    }
    // Si no hay id, category ni subcategory, se obtendrán todos los productos (sin WHERE)

    // Construir la consulta final
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(' AND ', $conditions);
    }

    // Añadir una condición para mostrar solo productos activos (si tienes una columna 'is_active')
    // Asegúrate de que esta columna exista en tu tabla 'products'
    // Descomenta la siguiente línea si tienes una columna 'is_active' y solo quieres mostrar productos activos
    // $sql .= (empty($conditions) ? ' WHERE ' : ' AND ') . 'is_active = 1';

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Procesar resultados
    if ($productId !== null) {
        // Si buscamos por ID, esperamos un solo resultado
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado']);
        } else {
            // Podrías querer buscar imágenes adicionales aquí si es necesario
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
    error_log('Database Error in get_products.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error en la base de datos. Por favor, inténtalo de nuevo más tarde.'
        // 'debug_message' => 'DB Error: ' . $e->getMessage() // Solo para desarrollo, no para producción
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
?>
