<?php
// File: backend/notificaciones.php

// --- INICIO: Habilitar errores para depuración ---
// IMPORTANT: Disable display_errors in production!
error_reporting(E_ALL);
ini_set('display_errors', 1); // Set to 0 in production
ini_set('log_errors', 1); // Log errors even if not displayed
// Consider setting a specific log file:
// ini_set('error_log', '/path/to/your/php-error.log');
// --- FIN: Depuración ---

// Start session BEFORE any output for session check
session_start();

// --- Configuración CORS Dinámica ---
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']; // Add your frontend origins
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin"); // Important for caching
} else {
    // Default or block disallowed origins
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Fallback for safety
}

header("Access-Control-Allow-Methods: GET, OPTIONS"); // Only GET needed here
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Keep Authorization if used elsewhere
header("Access-Control-Allow-Credentials: true"); // Crucial for 'include' credentials

// --- Manejo OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    // header("Access-Control-Max-Age: 86400"); // Optional: Cache preflight
    exit(); // Stop script execution for OPTIONS
}

// --- Establecer Content-Type JSON para la respuesta ---
// Must be AFTER potential exit() for OPTIONS
header("Content-Type: application/json");

// --- Conexión DB y Autenticación ---
require_once 'db.php'; // Ensure this defines your $pdo connection

// Verifica la sesión de administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'No autorizado. Por favor, inicie sesión.']);
    exit();
}

// --- Lógica para obtener notificaciones ---
try {
    // Select necessary columns. Order by most recent. Limit results for performance.
    $stmt = $pdo->query("SELECT id, message, type, created_at FROM notifications ORDER BY created_at DESC LIMIT 50");

    if (!$stmt) {
        // Log detailed error if query fails
        $errorInfo = $pdo->errorInfo();
        error_log("Error preparing/executing notification query: " . ($errorInfo[2] ?? 'Unknown PDO error'));
        throw new PDOException("Error al ejecutar la consulta de notificaciones.");
    }

    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the structure expected by React
    echo json_encode(['success' => true, 'data' => $notifications]);

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    error_log("PDOException fetching notifications: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor al obtener notificaciones.']);
} catch (Exception $e) {
    // Catch any other unexpected errors
    http_response_code(500);
    error_log("General Exception fetching notifications: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Ocurrió un error inesperado.']);
}

// Script ends here naturally
?>
