<?php
// --- INICIO: Habilitar errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
// --- FIN: Depuración ---

session_start();

// --- Configuración CORS Dinámica ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
// Permitir POST (como lo usa AdminNavbar) y OPTIONS
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// --- Manejo OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Establecer Content-Type JSON ---
header("Content-Type: application/json");

// --- Conexión DB y Autenticación ---
require_once 'db.php';

// Verifica la sesión
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'No autorizado']));
}

// --- Lógica de Eliminación ---

// Asegurarse que sea método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Método no permitido
    die(json_encode(['success' => false, 'message' => 'Método no permitido. Se esperaba POST.']));
}

// Obtener datos del cuerpo JSON
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE); // Convierte a array asociativo

// Validar JSON y ID
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Solicitud incorrecta
    die(json_encode(['success' => false, 'message' => 'JSON inválido recibido.']));
}

$notificationId = $input['id'] ?? null;

if (!$notificationId || !filter_var($notificationId, FILTER_VALIDATE_INT) || (int)$notificationId <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'ID de notificación inválido o no proporcionado']));
}
$notificationId = (int)$notificationId;

try {
    // Preparar y ejecutar la eliminación
    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = :id");
    $stmt->execute([':id' => $notificationId]);

    // Verificar si se eliminó
    if ($stmt->rowCount() > 0) {
        http_response_code(200); // OK
        echo json_encode([
            'success' => true,
            'message' => 'Notificación eliminada correctamente',
            'deletedId' => $notificationId // Devuelve el ID eliminado
        ]);
    } else {
        // No se encontró la notificación con ese ID
        http_response_code(404); // No encontrado
        echo json_encode(['success' => false, 'message' => 'Notificación no encontrada con ID: ' . $notificationId]);
    }

} catch (PDOException $e) {
    // Error de base de datos
    http_response_code(500);
    error_log("Error al eliminar notificación (ID: $notificationId): " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor al eliminar la notificación.']);
}

exit();
?>
