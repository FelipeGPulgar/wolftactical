<?php
// --- Habilitar CORS dinámico ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3002'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Comenzar POST ---
header("Content-Type: application/json");
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$message = $data['message'] ?? null;
$type = $data['type'] ?? null;
$product_id = $data['product_id'] ?? null;
$field_changed = $data['field_changed'] ?? null;
$old_value = $data['old_value'] ?? null;
$new_value = $data['new_value'] ?? null;

// --- Validación general ---
if (!$message || !$type) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
    exit();
}

// --- Si es notificación por cambio de producto ---
if ($product_id && $field_changed && $new_value !== null) {

    // Evita guardar si no hubo cambio real
    if ($old_value === $new_value) {
        echo json_encode([
            'success' => false,
            'message' => 'No se guardó la notificación porque no hubo cambio real'
        ]);
        exit();
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO notifications (product_id, message, field_changed, old_value, new_value, type, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$product_id, $message, $field_changed, $old_value, $new_value, $type]);

        echo json_encode([
            'success' => true,
            'message' => 'Notificación guardada',
            'id' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar: ' . $e->getMessage()]);
    }

} else {
    // Notificación general (sin producto asociado)
    try {
        $stmt = $pdo->prepare("INSERT INTO notifications (message, type, created_at) VALUES (?, ?, NOW())");
        $stmt->execute([$message, $type]);

        echo json_encode([
            'success' => true,
            'message' => 'Notificación general guardada',
            'id' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar: ' . $e->getMessage()]);
    }
}
?>
