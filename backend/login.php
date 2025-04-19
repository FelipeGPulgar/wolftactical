<?php
// Configuración de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración CORS
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002', 
    'http://localhost:3003',
    'http://127.0.0.1:3003'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // Default
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Manejo de OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';

session_start();

$response = ['success' => false, 'message' => ''];

try {
    // Solo aceptar método POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }

    // Obtener datos del cuerpo de la solicitud
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Formato de datos inválido');
    }

    // Validar campos
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        throw new Exception('Usuario y contraseña requeridos');
    }

    // Autenticación (en producción usaría password_hash/verify)
    if ($username === 'admin' && $password === 'admin1234') {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $username;
        $_SESSION['last_activity'] = time();
        
        $response = [
            'success' => true,
            'message' => 'Autenticación exitosa',
            'redirect' => '/admin/productos' // Ruta relativa
        ];
    } else {
        throw new Exception('Credenciales incorrectas');
    }
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>