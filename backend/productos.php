<?php
session_start();

// Configuración de CORS para desarrollo
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");

// Verifica si el usuario está logueado como administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('HTTP/1.1 401 Unauthorized');
    exit(json_encode(['error' => 'No autorizado']));
}

require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT * FROM products");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si es una solicitud AJAX/API, devolver JSON
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'data' => $products]);
        exit;
    }
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <?php include('navbar.php'); ?>

    <div class="admin-container">
        <div class="admin-header">
            <h1><i class="fas fa-boxes"></i> Lista de Productos</h1>
            <a href="agregar_producto.php" class="btn btn-primary">
                <i class="fas fa-plus"></i> Agregar Producto
            </a>
        </div>

        <?php if (empty($products)): ?>
            <div class="empty-state">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>No hay productos disponibles</h3>
                <p>Comienza agregando tu primer producto</p>
                <a href="agregar_producto.php" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Agregar Producto
                </a>
            </div>
        <?php else: ?>
        <div class="table-responsive">
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Modelo</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Precio</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($products as $product): ?>
                        <tr>
                            <td>
                                <div class="product-info">
                                    <?php if ($product['main_image']): ?>
                                        <img src="imagenes/<?php echo htmlspecialchars($product['main_image']); ?>" 
                                             alt="<?php echo htmlspecialchars($product['name']); ?>" 
                                             class="product-thumbnail">
                                    <?php endif; ?>
                                    <?php echo htmlspecialchars($product['name']); ?>
                                </div>
                            </td>
                            <td><?php echo htmlspecialchars($product['model']); ?></td>
                            <td><?php echo htmlspecialchars($product['category']); ?></td>
                            <td>
                                <span class="badge <?php echo $product['stock_option'] === 'instock' ? 'badge-success' : 'badge-warning'; ?>">
                                    <?php echo $product['stock_option'] === 'instock' ? 
                                          'En stock (' . htmlspecialchars($product['stock_quantity']) . ')' : 
                                          'Por encargo'; ?>
                                </span>
                            </td>
                            <td>$<?php echo number_format($product['price'], 2, ',', '.'); ?></td>
                            <td class="actions">
                                <a href="editar_producto.php?id=<?php echo $product['id']; ?>" 
                                   class="btn btn-edit" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </a>
                                <a href="eliminar_producto.php?id=<?php echo $product['id']; ?>" 
                                   class="btn btn-danger" 
                                   title="Eliminar"
                                   onclick="return confirm('¿Estás seguro de eliminar este producto?')">
                                    <i class="fas fa-trash-alt"></i>
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>

    <?php include('footer.php'); ?>
    
    <script>
    // Script para manejar acciones sin recargar la página
    document.addEventListener('DOMContentLoaded', function() {
        // Confirmación antes de eliminar
        const deleteButtons = document.querySelectorAll('.btn-danger');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                if (!confirm('¿Estás seguro de eliminar este producto?')) {
                    e.preventDefault();
                }
            });
        });
    });
    </script>
</body>
</html>