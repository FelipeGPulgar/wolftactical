<?php
// backend/logout.php
session_start();

// Configuración CORS (igual que en login.php)
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', // Added localhost:3001 to allowed origins
    'http://localhost:3002',
    'http://localhost:3003'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}

header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Destruir la sesión
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}
session_destroy();

echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
?>