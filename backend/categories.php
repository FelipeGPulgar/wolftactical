<?php
// Dynamically set the Access-Control-Allow-Origin header
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
require_once 'db.php';

try {
    $query = "SELECT c1.id, c1.name, c2.id AS sub_id, c2.name AS sub_name
              FROM categories c1
              LEFT JOIN categories c2 ON c1.id = c2.parent_id
              WHERE c1.parent_id IS NULL";

    $stmt = $pdo->prepare($query);
    $stmt->execute();

    $categories = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categoryId = $row['id'];
        if (!isset($categories[$categoryId])) {
            $categories[$categoryId] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'subcategories' => []
            ];
        }

        if ($row['sub_id']) {
            $categories[$categoryId]['subcategories'][] = [
                'id' => $row['sub_id'],
                'name' => $row['sub_name']
            ];
        }
    }

    echo json_encode(array_values($categories));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching categories']);
}
?>