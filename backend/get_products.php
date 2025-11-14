<?php
// --- INICIO: Habilitar errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1); // ¡MUY IMPORTANTE! Cambiar a 0 en producción
ini_set('log_errors', 1);
// --- FIN: Depuración ---

session_start(); // Mantener por si acaso
$debug = isset($_GET['debug']);

// Configuración dinámica de CORS
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

require_once 'db.php'; // Asegúrate que $pdo se define aquí

function tryQuery($pdo, $sql, $params) {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (Throwable $e) {
        error_log('[get_products fallback] SQL failed: ' . $e->getMessage() . ' | SQL: ' . $sql);
        return null;
    }
}

try {
    // --- Determinar qué se está solicitando ---
    $productId = $_GET['id'] ?? null;
    $categoryName = $_GET['category'] ?? null;
    $subcategoryName = $_GET['subcategory'] ?? null;
    $categoryId = isset($_GET['category_id']) ? $_GET['category_id'] : null;
    $sort = $_GET['sort'] ?? null; // valores permitidos: newest, price_asc, price_desc, name
    $show = $_GET['show'] ?? null; // 'all' para incluir inactivos

    // --- Validación básica de parámetros ---
    if ($productId !== null && !filter_var($productId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'ID de producto inválido.']));
    }
    $productId = $productId ? (int)$productId : null; // Convertir a int si no es null

    // --- Construcción de la Consulta SQL ---
    // Intentar usar la vista v_products_with_cover si existe
    $sql = "SELECT vp.*, c_main.name AS category_name, sc.name AS subcategory_name
            FROM v_products_with_cover vp ";
    $params = [];
    $conditions = [];
    $joins = ""; // String para almacenar los JOINs necesarios

    // Condición de activos salvo que se pida 'show=all'
    if ($show !== 'all') {
        $conditions[] = "vp.is_active = 1";
    }

    if ($productId !== null) {
        // --- Obtener un solo producto por ID ---
        $conditions[] = "vp.id = :id";
        $params[':id'] = $productId;
        $joins .= " LEFT JOIN categories c_main ON vp.category_id = c_main.id ";
        $joins .= " LEFT JOIN subcategories sc ON vp.subcategory_id = sc.id ";

    } elseif ($subcategoryName !== null) {
        // --- Obtener productos por NOMBRE de SUBCATEGORÍA ---
        $joins .= " INNER JOIN subcategories sc ON vp.subcategory_id = sc.id ";
    $conditions[] = "sc.name = :subcategory_name";
        $params[':subcategory_name'] = $subcategoryName;

        // Opcional: Si también se proporciona el nombre de la categoría principal, añadir otro join y condición
        if ($categoryName !== null) {
            // Asegurarnos que la subcategoría pertenece a la categoría principal correcta
            $joins .= " INNER JOIN categories c_main ON vp.category_id = c_main.id ";
            $conditions[] = "c_main.name = :category_name";
            $params[':category_name'] = $categoryName;
        } else {
             // Si no se da categoría principal, añadimos el join para obtener su nombre
             $joins .= " LEFT JOIN categories c_main ON vp.category_id = c_main.id ";
        }

    } elseif ($categoryName !== null) {
        // --- Obtener productos por NOMBRE de CATEGORÍA PRINCIPAL ---
        $joins .= " INNER JOIN categories c_main ON vp.category_id = c_main.id ";
        $conditions[] = "c_main.name = :category_name";
        $params[':category_name'] = $categoryName;
        $joins .= " LEFT JOIN subcategories sc ON vp.subcategory_id = sc.id ";

    } else {
        // --- Obtener TODOS los productos (activos) ---
        $joins .= " LEFT JOIN categories c_main ON vp.category_id = c_main.id ";
        $joins .= " LEFT JOIN subcategories sc ON vp.subcategory_id = sc.id ";
    }

    // Filtro por category_id si se proporciona (tiene prioridad sobre category name)
    if ($categoryId !== null) {
        if (!filter_var($categoryId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])) {
            http_response_code(400);
            die(json_encode(['success' => false, 'message' => 'category_id inválido.']));
        }
        $joins .= " LEFT JOIN categories c_main ON vp.category_id = c_main.id ";
        $conditions[] = "vp.category_id = :category_id";
        $params[':category_id'] = (int)$categoryId;
    }

    // Combinar SQL, Joins y Condiciones
    $sql .= $joins; // Añadir los joins
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(' AND ', $conditions);
    }

    // Opcional: Añadir ordenación
    // Ordenación
    $orderBy = " ORDER BY vp.name ASC";
    if ($sort === 'newest') {
        $orderBy = " ORDER BY vp.created_at DESC, vp.id DESC";
    } elseif ($sort === 'price_asc') {
        $orderBy = " ORDER BY vp.price ASC, vp.id ASC";
    } elseif ($sort === 'price_desc') {
        $orderBy = " ORDER BY vp.price DESC, vp.id DESC";
    } elseif ($sort === 'name') {
        $orderBy = " ORDER BY vp.name ASC";
    }
    $sql .= $orderBy; // Añadir ordenación

    // --- Preparar y Ejecutar con fallbacks ---
    $stmt = tryQuery($pdo, $sql, $params);

    // Fallback 1: quitar filtro is_active por si la vista no incluye la columna
    if (!$stmt) {
        $sql_fb1 = str_replace(' WHERE vp.is_active = 1', ' WHERE 1=1', $sql);
        $stmt = tryQuery($pdo, $sql_fb1, $params);
        if ($stmt) { $sql = $sql_fb1; }
    }

    // Fallback 2: si no existe la vista, consultar directamente a products con subselect para cover_image
    if (!$stmt) {
        $sql_fb2 = "SELECT p.*, c_main.name AS category_name, sc.name AS subcategory_name,
                        COALESCE(
                           (SELECT pi1.path FROM product_images pi1 WHERE pi1.product_id = p.id AND pi1.is_cover = 1 ORDER BY pi1.sort_order ASC, pi1.id ASC LIMIT 1),
                           (SELECT pi2.path FROM product_images pi2 WHERE pi2.product_id = p.id ORDER BY pi2.sort_order ASC, pi2.id ASC LIMIT 1)
                        ) AS cover_image
                     FROM products p ";
        // reconstruir joins mínimos
        $joins_min = '';
        if (strpos($sql, 'categories c_main') !== false) {
            $joins_min .= ' LEFT JOIN categories c_main ON p.category_id = c_main.id ';
        }
        if (strpos($sql, 'subcategories sc') !== false) {
            $joins_min .= ' LEFT JOIN subcategories sc ON p.subcategory_id = sc.id ';
        }
        $sql_fb2 .= $joins_min;
        if (!empty($conditions)) {
            $conds2 = array_map(function($c){ return str_replace('vp.', 'p.', $c); }, $conditions);
            $sql_fb2 .= ' WHERE ' . implode(' AND ', $conds2);
        }
    // Aplicar mismo criterio de orden en fallback
    if ($sort === 'newest') { $sql_fb2 .= ' ORDER BY p.created_at DESC, p.id DESC'; }
    elseif ($sort === 'price_asc') { $sql_fb2 .= ' ORDER BY p.price ASC, p.id ASC'; }
    elseif ($sort === 'price_desc') { $sql_fb2 .= ' ORDER BY p.price DESC, p.id DESC'; }
    else { $sql_fb2 .= ' ORDER BY p.name ASC'; }

        $stmt = tryQuery($pdo, $sql_fb2, $params);
        if ($stmt) { $sql = $sql_fb2; }
    }

    // Fallback 3: quitar joins de subcategoría si la tabla no existe
    if (!$stmt) {
        $sql_fb3 = preg_replace('/\s+(LEFT|INNER)\s+JOIN\s+subcategories\s+sc\s+ON\s+(vp|p)\.subcategory_id\s*=\s*sc\.id\s*/i', ' ', $sql);
        $stmt = tryQuery($pdo, $sql_fb3, $params);
        if ($stmt) { $sql = $sql_fb3; }
    }

    // Fallback 4: lista básica sin condiciones ni parámetros
    if (!$stmt) {
        $sql_fb4 = "SELECT p.*, COALESCE(
                        (SELECT pi1.path FROM product_images pi1 WHERE pi1.product_id = p.id AND pi1.is_cover = 1 ORDER BY pi1.sort_order ASC, pi1.id ASC LIMIT 1),
                        (SELECT pi2.path FROM product_images pi2 WHERE pi2.product_id = p.id ORDER BY pi2.sort_order ASC, pi2.id ASC LIMIT 1)
                    ) AS cover_image
                    FROM products p ";
        if ($sort === 'newest') { $sql_fb4 .= ' ORDER BY p.created_at DESC, p.id DESC'; }
        elseif ($sort === 'price_asc') { $sql_fb4 .= ' ORDER BY p.price ASC, p.id ASC'; }
        elseif ($sort === 'price_desc') { $sql_fb4 .= ' ORDER BY p.price DESC, p.id DESC'; }
        else { $sql_fb4 .= ' ORDER BY p.name ASC'; }
        $sql_fb4 .= ' LIMIT 200';
        $stmt = tryQuery($pdo, $sql_fb4, []);
        if ($stmt) { $sql = $sql_fb4; $params = []; }
    }

    if (!$stmt) {
        throw new Exception('No se pudo ejecutar la consulta de productos (estructura de tabla inesperada).');
    }

    // --- Procesar Resultados ---
    if ($productId !== null) {
        // Si buscamos por ID, esperamos un solo resultado
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado o inactivo']);
        } else {
            // Añadir imágenes de galería y colores, si existen
            try {
                $imgsStmt = $pdo->prepare("SELECT id, path, is_cover, sort_order FROM product_images WHERE product_id = :pid ORDER BY is_cover DESC, sort_order ASC, id ASC");
                $imgsStmt->execute([':pid' => $productId]);
                $images = $imgsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            } catch (Throwable $t) {
                $images = [];
            }

            try {
                $colorsStmt = $pdo->prepare("SELECT id, name, hex FROM product_colors WHERE product_id = :pid ORDER BY id ASC");
                $colorsStmt->execute([':pid' => $productId]);
                $colors = $colorsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            } catch (Throwable $t) {
                $colors = [];
            }

            echo json_encode(['success' => true, 'data' => $product, 'images' => $images, 'colors' => $colors]);
        }
    } else {
        // Si buscamos por categoría/subcategoría o todos, esperamos una lista
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Aquí podrías iterar sobre $products para añadir imágenes adicionales si es necesario
        echo json_encode(['success' => true, 'data' => $products]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log('Database Error in get_products.php: ' . $e->getMessage() . " SQL: " . ($sql ?? 'N/A') . " Params: " . json_encode($params ?? []));
    $resp = ['success' => false, 'message' => 'Error en la base de datos al obtener productos.'];
    if ($debug) { $resp['debug'] = ['error' => $e->getMessage(), 'sql' => ($sql ?? null), 'params' => ($params ?? null)]; }
    echo json_encode($resp);
} catch (Exception $e) {
    http_response_code(500);
    error_log('General Error in get_products.php: ' . $e->getMessage());
    $resp = ['success' => false, 'message' => 'Ocurrió un error inesperado.'];
    if ($debug) { $resp['debug'] = ['error' => $e->getMessage(), 'sql' => ($sql ?? null), 'params' => ($params ?? null)]; }
    echo json_encode($resp);
}
exit(); // Terminar script explícitamente
?>
