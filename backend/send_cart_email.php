<?php
// Endpoint to send an email with the entire cart contents
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed = ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
    }
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit();
}

$customerEmail = trim($data['customer_email'] ?? '');
$items = $data['items'] ?? [];
if (!is_array($items)) { $items = []; }

// Validate items minimal structure
$cleanItems = [];
foreach ($items as $it) {
    if (!is_array($it)) continue;
    $name = trim($it['name'] ?? '');
    if ($name === '') continue; // skip invalid item
    $quantity = isset($it['quantity']) ? max(1, (int)$it['quantity']) : 1;
    $color = trim($it['color'] ?? '');
    $price = isset($it['price']) ? (float)$it['price'] : 0.0; // unit price
    $cleanItems[] = [
        'name' => $name,
        'quantity' => $quantity,
        'color' => $color,
        'price' => $price
    ];
}

if (empty($cleanItems)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No hay items válidos en el carrito']);
    exit();
}

// Validate email domain (optional but if provided must pass) gmail/hotmail/outlook
if ($customerEmail !== '') {
    if (!filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        exit();
    }
    $domain = strtolower(substr(strrchr($customerEmail, '@'), 1));
    $allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com'];
    if (!in_array($domain, $allowedDomains)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Solo se permiten Gmail/Hotmail/Outlook']);
        exit();
    }
}

$storeEmail = 'iifeeedtactical@gmail.com';
$subject = 'Consulta/Orden Carrito - WolfTactical';

$lines = [];
$lines[] = 'Orden / Consulta de Carrito:';
$total = 0.0;
foreach ($cleanItems as $it) {
    $lineSubtotal = $it['price'] * $it['quantity'];
    $total += $lineSubtotal;
    $lines[] = '- Producto: ' . $it['name'];
    $lines[] = '  Cantidad: ' . $it['quantity'];
    if ($it['color'] !== '') $lines[] = '  Color: ' . $it['color'];
    $lines[] = '  Precio unitario: $' . number_format($it['price'], 0, ',', '.');
    $lines[] = '  Subtotal: $' . number_format($lineSubtotal, 0, ',', '.');
}
$lines[] = 'TOTAL: $' . number_format($total, 0, ',', '.');
if ($customerEmail !== '') { $lines[] = 'Email del cliente: ' . $customerEmail; }

$body = implode("\n", $lines) . "\n\n--\nEnviado automáticamente desde WolfTactical";

$headers = 'From: notificaciones@wolftactical.local' . "\r\n" .
           'Reply-To: ' . ($customerEmail !== '' ? $customerEmail : 'no-reply@wolftactical.local') . "\r\n" .
           'X-Mailer: PHP/' . phpversion();

$ok = @mail($storeEmail, $subject, $body, $headers);

if ($ok) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo enviar el correo (mail)']);
}
