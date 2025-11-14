<?php
// Configuración de errores (ocultar en producción)
ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Manejo de OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Endurecer cookies de sesión antes de iniciar sesión
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
if (function_exists('session_set_cookie_params')) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

require_once __DIR__ . '/db.php';

session_start();

// --- Seguridad: limitador de intentos por IP y bloqueo ---
$storageDir = __DIR__ . '/uploads/security';
$blockedFile = $storageDir . '/blocked_ips.json';
$attemptsFile = $storageDir . '/login_attempts.json';

function getClientIp(): string {
    $keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $ip = $_SERVER[$k];
            // Si viene lista de IPs por proxy, tomar la primera
            if ($k === 'HTTP_X_FORWARDED_FOR' && strpos($ip, ',') !== false) {
                $parts = explode(',', $ip);
                return trim($parts[0]);
            }
            return $ip;
        }
    }
    return '0.0.0.0';
}

function readJsonFile($path) {
    if (!file_exists($path)) return [];
    $fp = fopen($path, 'r');
    if (!$fp) return [];
    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function writeJsonFile($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir)) {@mkdir($dir, 0777, true);}    
    $tmp = $path . '.tmp';
    $fp = fopen($tmp, 'w');
    if (!$fp) return false;
    flock($fp, LOCK_EX);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return rename($tmp, $path);
}

$ip = getClientIp();
$now = time();

// Comprobar bloqueo previo
$blocked = readJsonFile($blockedFile);
$fingerprint = hash('sha256', json_encode([
    $_SERVER['HTTP_USER_AGENT'] ?? '',
    $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''
]));
if ((isset($blocked[$ip]) && $blocked[$ip] > $now) || (isset($blocked[$fingerprint]) && $blocked[$fingerprint] > $now)) {
    // Silencioso: no indicar motivo específico
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit();
}

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

    if ($username === '' || $password === '') {
        throw new Exception('Credenciales incorrectas');
    }

    // Credenciales únicas de administrador
    $ADMIN_USERNAME = 'ifeed';
    $ADMIN_PASSWORD = 'felipewenopalcatre123';
    $ADMIN_EMAIL = 'iifeeedtactical@gmail.com'; // Referencia informativa

    if ($username === $ADMIN_USERNAME && $password === $ADMIN_PASSWORD) {
        // Éxito: resetear intentos
        $attempts = readJsonFile($attemptsFile);
        if (isset($attempts[$ip])) { unset($attempts[$ip]); writeJsonFile($attemptsFile, $attempts); }
        if (isset($_SESSION['login_attempts']) && isset($_SESSION['login_attempts'][$ip])) {
            unset($_SESSION['login_attempts'][$ip]);
        }

    // Éxito: reforzar sesión
    session_regenerate_id(true);
    $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $ADMIN_USERNAME;
        $_SESSION['admin_email'] = $ADMIN_EMAIL;
        $_SESSION['last_activity'] = $now;

        $response = [
            'success' => true,
            'message' => 'Autenticación exitosa',
            'redirect' => '/admin/productos'
        ];
    } else {
        // Fallo: incrementar intentos y bloquear al llegar a 3
        // Contador por archivo (per-IP)
        $attempts = readJsonFile($attemptsFile);
        $count = isset($attempts[$ip]) ? (int)$attempts[$ip] : 0;
        $count++;
        $attempts[$ip] = $count;
        writeJsonFile($attemptsFile, $attempts);

        // Contador también en sesión (respaldo por si el archivo no es escribible)
        if (!isset($_SESSION['login_attempts'])) { $_SESSION['login_attempts'] = []; }
        if (!isset($_SESSION['login_attempts'][$ip])) { $_SESSION['login_attempts'][$ip] = 0; }
        $_SESSION['login_attempts'][$ip]++;

        $sessionCount = (int)$_SESSION['login_attempts'][$ip];
        if ($count >= 3 || $sessionCount >= 3) {
            $expires = $now + 5 * 60 * 60; // 5 horas
            $blocked[$ip] = $expires;
            $blocked[$fingerprint] = $expires;
            writeJsonFile($blockedFile, $blocked);
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
            exit();
        }

        throw new Exception('Credenciales incorrectas');
    }
} catch (Exception $e) {
    // Respuesta genérica para no dar pistas
    if (!http_response_code() || http_response_code() < 400) {
        http_response_code(401);
    }
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>