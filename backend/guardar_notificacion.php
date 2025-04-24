<?php
// --- INICIO: Habilitar errores para depuración ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
// --- FIN: Depuración ---

// No necesita session_start() si no valida sesión aquí (depende de tu lógica)
// session_start();

// --- Configuración CORS Dinámica ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Permitir Authorization si es necesario
header("Access-Control-Allow-Credentials: true"); // Necesario si React envía 'include'

// --- Manejo OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Establecer Content-Type JSON ---
header("Content-Type: application/json");

// --- Conexión DB ---
require_once 'db.php';

// --- Lógica para Guardar Notificación ---

// Asegurarse que sea método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Método no permitido. Se esperaba POST.']));
}

// Obtener datos del cuerpo JSON
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

// Validar JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'JSON inválido recibido.']));
}

// Obtener datos (usando null coalescing operator ??)
$message = $input['message'] ?? null;
$type = $input['type'] ?? 'info'; // Default a 'info' si no se especifica
// Campos opcionales para notificaciones de producto
$product_id = isset($input['product_id']) ? (int)$input['product_id'] : null;
$field_changed = $input['field_changed'] ?? null;
$old_value = $input['old_value'] ?? null;
$new_value = $input['new_value'] ?? null;

// Validación básica
if (empty($message)) { // El tipo ya tiene default
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'El mensaje de la notificación es obligatorio.']));
}

// Evitar guardar si es un cambio de producto y no hubo cambio real
if ($product_id && $field_changed && $old_value === $new_value) {
    // No es un error, simplemente no se guarda
    echo json_encode([
        'success' => true, // Indica éxito en la solicitud, aunque no se guardó
        'message' => 'No se guardó notificación: sin cambio real detectado.',
        'id' => null // No hay ID nuevo
    ]);
    exit();
}

try {
    // Determinar la consulta SQL basada en si es notificación de producto o general
    if ($product_id && $field_changed) {
        $sql = "INSERT INTO notifications (product_id, message, field_changed, old_value, new_value, type, created_at)
                VALUES (:product_id, :message, :field_changed, :old_value, :new_value, :type, NOW())";
        $params = [
            ':product_id' => $product_id,
            ':message' => $message,
            ':field_changed' => $field_changed,
            ':old_value' => $old_value,
            ':new_value' => $new_value,
            ':type' => $type
        ];
    } else {
        $sql = "INSERT INTO notifications (message, type, created_at)
                VALUES (:message, :type, NOW())";
        $params = [
            ':message' => $message,
            ':type' => $type
        ];
    }

    // Preparar y ejecutar
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Respuesta exitosa
    http_response_code(201); // Creado
    echo json_encode([
        'success' => true,
        'message' => 'Notificación guardada correctamente.',
        'id' => $pdo->lastInsertId() // Devuelve el ID de la nueva notificación
    ]);

} catch (PDOException $e) {
    // Error de base de datos
    http_response_code(500);
    error_log("Error al guardar notificación: " . $e->getMessage() . " Data: " . json_encode($input));
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor al guardar la notificación.']);
}

exit();
?>
