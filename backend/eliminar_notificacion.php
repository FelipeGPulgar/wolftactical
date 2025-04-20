<?php
// Ensure proper CORS headers for all origins used in the project
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido']);
    exit();
}

$id = $data['id'] ?? null;

// Agregar logs para depuración
error_log("Iniciando proceso de eliminación de notificación");
error_log("Datos recibidos: " . json_encode($data));

if (!$id || !is_numeric($id)) {
    error_log("Error: ID de notificación no proporcionado o inválido");
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit();
}

try {
    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = :id");
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() > 0) {
        error_log("Notificación con ID $id eliminada con éxito");
        echo json_encode([
            'success' => true,
            'message' => 'Notificación eliminada correctamente',
            'deletedId' => $id
        ]);
    } else {
        error_log("Error: Notificación con ID $id no encontrada");
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Notificación no encontrada']);
    }
} catch (PDOException $e) {
    error_log("Error en la base de datos: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en base de datos: ' . $e->getMessage()
    ]);
}
?>
