<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("DESCRIBE product_colors");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
