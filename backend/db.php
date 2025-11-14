<?php
$blockedFilePrimary = __DIR__ . '/blocked_ips.json';
$blockedFileAlt = __DIR__ . '/uploads/security/blocked_ips.json';

// Verificación global de IP bloqueada (aplica a todos los endpoints que incluyan db.php)
function __getClientIpForBlocklist(): string {
    $keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $ip = $_SERVER[$k];
            if ($k === 'HTTP_X_FORWARDED_FOR' && strpos($ip, ',') !== false) {
                $parts = explode(',', $ip);
                return trim($parts[0]);
            }
            return $ip;
        }
    }
    return '0.0.0.0';
}

function __readJson($path) {
    if (!file_exists($path)) return [];
    $fp = fopen($path, 'r'); if (!$fp) return [];
    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

$__blocked = [];
// Merge blocks from both possible locations (legacy + new)
foreach ([$blockedFilePrimary, $blockedFileAlt] as $__bf) {
    $data = __readJson($__bf);
    if (is_array($data)) { $__blocked = array_replace($__blocked, $data); }
}
$__ipHeaderHash = hash('sha256', json_encode([
    $_SERVER['HTTP_USER_AGENT'] ?? '',
    $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''
]));
$__ip = __getClientIpForBlocklist();
// Defensa adicional: vincular bloqueo también a fingerprint ligero de headers
if ((isset($__blocked[$__ip]) && $__blocked[$__ip] > time()) || (isset($__blocked[$__ipHeaderHash]) && $__blocked[$__ipHeaderHash] > time())) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit();
}

$host = 'localhost';
$primaryDb = 'wolftactical';
$fallbackDb = 'sistema_tienda';
$username = 'root';
$password = '';
$charset = 'utf8mb4'; // Buena práctica

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// Intentar conectar primero a wolftactical y luego a sistema_tienda como respaldo
foreach ([$primaryDb, $fallbackDb] as $dbname) {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
    try {
        $pdo = new PDO($dsn, $username, $password, $options);
        break; // Conexión exitosa
    } catch (PDOException $e) {
        error_log("[DB Connect] Falló conexión a '$dbname': " . $e->getMessage());
        $pdo = null;
        continue;
    }
}

if (!$pdo) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
    }
    die(json_encode([
        "success" => false,
        "message" => "No se pudo conectar a las bases de datos configuradas. Verifique 'wolftactical' o 'sistema_tienda'."
    ]));
}
?>
