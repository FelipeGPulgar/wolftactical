<?php
// --- INICIO: Habilitar TODOS los errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
// --- FIN: Depuración ---

session_start();

// --- Configuración CORS ---
// Es crucial enviar estas cabeceras ANTES de cualquier salida
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Valor predeterminado
}
// Permitir método GET (o DELETE/POST si cambias el frontend) y OPTIONS
header("Access-Control-Allow-Methods: GET, DELETE, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// --- Manejo OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Establecer Content-Type JSON para todas las respuestas reales ---
header("Content-Type: application/json");

// --- Conexión DB (Usando PDO de db.php) y Autenticación ---
require_once 'db.php'; // Asegúrate que la ruta sea correcta y que usa PDO ($pdo)

// Verifica la sesión DESPUÉS de incluir db.php
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401); // No Autorizado
    // Usar die() para asegurar que no continúe
    die(json_encode(['success' => false, 'message' => 'No autorizado']));
}

// --- Lógica de Eliminación ---

// Determinar el método (GET es menos seguro para eliminar, considera DELETE o POST)
$request_method = $_SERVER['REQUEST_METHOD'];
$productId = null;

// Tu frontend actualmente usa GET con el ID en la URL
if ($request_method === 'GET') {
    $productId = $_GET['id'] ?? null;
} else {
    // Si decides cambiar a DELETE o POST en el futuro
    http_response_code(405); // Método no permitido
    die(json_encode(['success' => false, 'message' => 'Método no permitido. Se esperaba GET.']));
}


// Validación del ID
if (!$productId || !filter_var($productId, FILTER_VALIDATE_INT) || (int)$productId <= 0) {
    http_response_code(400); // Solicitud incorrecta
    die(json_encode(['success' => false, 'message' => 'ID de producto inválido o no proporcionado']));
}
$productId = (int)$productId;

try {
    // 1. (Opcional) Obtener la ruta de la imagen antes de eliminar
    $imgStmt = $pdo->prepare("SELECT main_image FROM products WHERE id = :id");
    $imgStmt->execute([':id' => $productId]);
    $imagePath = $imgStmt->fetchColumn(); // Obtiene solo la primera columna de la fila

    // 2. Preparar la sentencia de eliminación (¡Usando sentencia preparada!)
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = :id");

    // 3. Ejecutar la eliminación, pasando el ID de forma segura
    $stmt->execute([':id' => $productId]);

    // 4. Verificar si se eliminó alguna fila
    if ($stmt->rowCount() > 0) {
        // Si se eliminó, intentar borrar el archivo de imagen asociado
        // Asegúrate que la ruta en $imagePath sea correcta relativa a este script
        if ($imagePath && file_exists($imagePath)) {
            @unlink($imagePath); // Usar @ para suprimir errores si no se puede borrar
            error_log("Imagen eliminada (o intento): " . $imagePath); // Log opcional
        } else if ($imagePath) {
            error_log("Advertencia: Imagen no encontrada para borrar en ruta: " . $imagePath);
        }

        // Opcional: Añadir notificación
        try {
            $notificationSql = "INSERT INTO notifications (message, type, created_at) VALUES (:message, :type, NOW())";
            $notificationStmt = $pdo->prepare($notificationSql);
            $notificationStmt->execute([
                'message' => "Producto (ID: $productId) eliminado.",
                'type' => 'warning' // o 'danger'
            ]);
        } catch (PDOException $e) {
            error_log("Error al guardar notificación de eliminación para producto ID $productId: " . $e->getMessage());
        }

        // Respuesta exitosa JSON
        http_response_code(200); // OK
        echo json_encode(['success' => true, 'message' => 'Producto eliminado correctamente']);

    } else {
        // Si rowCount es 0, significa que el producto con ese ID no existía
        http_response_code(404); // No encontrado
        echo json_encode(['success' => false, 'message' => 'Producto no encontrado con ID: ' . $productId]);
    }

} catch (PDOException $e) {
    // Captura errores de base de datos (PDO)
    http_response_code(500); // Error Interno del Servidor
    // Loggear el error real es crucial para el desarrollador
    error_log("Error al eliminar producto (ID: $productId): " . $e->getMessage());
    // Mensaje genérico para el cliente
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor al eliminar el producto.']);
} catch (Exception $e) {
    // Captura otros errores generales
    http_response_code(500);
    error_log("Error general al eliminar producto (ID: $productId): " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Ocurrió un error inesperado.']);
}

exit(); // Terminar el script explícitamente
?>
