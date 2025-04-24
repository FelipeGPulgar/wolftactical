<?php
$host = 'localhost';
$dbname = 'sistema_tienda'; // Verifica el nombre de tu BD
$username = 'root';
$password = '';
$charset = 'utf8mb4'; // Buena práctica

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    error_log("Error de conexión a la base de datos: " . $e->getMessage());
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
    }
    die(json_encode([
        "success" => false,
        "message" => "Error interno del servidor al conectar con la base de datos."
    ]));
}
?>
