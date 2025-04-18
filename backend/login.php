<?php
// ------------------- CORS --------------------
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
    exit(0);
}

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// ------------------- Base de datos --------------------
require_once __DIR__ . '/db.php';
session_start();

$response = ['success' => false, 'message' => '', 'redirect' => null];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        throw new Exception('Usuario y contraseña requeridos');
    }

    // AUTENTICACIÓN BÁSICA
    if ($username === 'admin' && $password === 'admin1234') {
        $_SESSION['user'] = ['username' => 'admin'];
        $response = [
            'success' => true,
            'message' => 'Autenticación exitosa',
            'redirect' => '/producto.php', // Aquí cambiamos la redirección
            'user_type' => 'administrador'
        ];
    } else {
        throw new Exception('Credenciales incorrectas');
    }
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

http_response_code(200);
echo json_encode($response);
?>
