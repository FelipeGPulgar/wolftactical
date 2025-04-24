<?php
// --- INICIO: Habilitar errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
// --- FIN: Depuración ---

session_start();

// --- Configuración CORS Dinámica ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']; // Añade todos tus puertos/orígenes de desarrollo
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Considera bloquear o usar un origen predeterminado seguro
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Methods: GET, OPTIONS"); // Solo GET y OPTIONS
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// --- Manejo OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Establecer Content-Type JSON para la respuesta ---
header("Content-Type: application/json");

// --- Conexión DB y Autenticación ---
require_once 'db.php'; // Usa la conexión PDO ($pdo)

// Verifica la sesión DESPUÉS de incluir db.php
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'No autorizado']));
}

// --- Lógica para obtener notificaciones ---
try {
    // Selecciona las columnas necesarias, incluyendo created_at
    $stmt = $pdo->query("SELECT id, message, type, created_at FROM notifications ORDER BY created_at DESC");
    if (!$stmt) {
        throw new PDOException("Error al preparar la consulta de notificaciones.");
    }
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Devuelve la estructura esperada por React { success: true, data: [...] }
    echo json_encode(['success' => true, 'data' => $notifications]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error al obtener notificaciones: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor al obtener notificaciones.']);
}

exit();
?>
