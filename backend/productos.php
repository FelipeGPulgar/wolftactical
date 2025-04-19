<?php
session_start();

// Verifica si el usuario está logueado como administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

require_once 'db.php'; // Usar db.php para la conexión a la base de datos

try {
    $stmt = $pdo->query("SELECT * FROM products");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Error al obtener los productos: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Productos</title>
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <?php include('navbar.php'); ?>

    <div class="admin-container">
        <h1>Lista de Productos</h1>
        <a href="agregar_producto.php" class="btn-add">Agregar nuevo producto</a>

        <?php if (empty($products)): ?>
            <p>No hay productos disponibles.</p>
        <?php else: ?>
        <table class="products-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Modelo</th>
                    <th>Categoría</th>
                    <th>Subcategoría</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($products as $product): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($product['name']); ?></td>
                        <td><?php echo htmlspecialchars($product['model']); ?></td>
                        <td><?php echo htmlspecialchars($product['category']); ?></td>
                        <td><?php echo htmlspecialchars($product['subcategory']); ?></td>
                        <td><?php echo $product['stock_option'] === 'instock' ? htmlspecialchars($product['stock_quantity']) : 'Por encargo'; ?></td>
                        <td>$<?php echo number_format($product['price'], 0, ',', '.'); ?></td>
                        <td class="actions">
                            <a href="editar_producto.php?id=<?php echo $product['id']; ?>" class="btn-edit">Editar</a>
                            <a href="eliminar_producto.php?id=<?php echo $product['id']; ?>" class="btn-delete" onclick="return confirm('¿Estás seguro de eliminar este producto?')">Eliminar</a>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>

    <?php include('footer.php'); ?>
</body>
</html>