<?php
session_start();

// Verifica si el usuario está logueado como administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

include('conexion.php');  // Asegúrate de incluir el archivo de conexión

$sql = "SELECT * FROM products";
$result = mysqli_query($conn, $sql);
?>

<h1>Lista de Productos</h1>
<a href="agregar_producto.php">Agregar nuevo producto</a>

<table>
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
        <?php while ($row = mysqli_fetch_assoc($result)): ?>
            <tr>
                <td><?php echo $row['name']; ?></td>
                <td><?php echo $row['model']; ?></td>
                <td><?php echo $row['category']; ?></td>
                <td><?php echo $row['subcategory']; ?></td>
                <td><?php echo $row['stock_option'] == 'instock' ? $row['stock_quantity'] : 'Por encargo'; ?></td>
                <td>$<?php echo number_format($row['price'], 0, ',', '.'); ?></td>
                <td>
                    <a href="editar_producto.php?id=<?php echo $row['id']; ?>">Editar</a>
                    <a href="eliminar_producto.php?id=<?php echo $row['id']; ?>">Eliminar</a>
                </td>
            </tr>
        <?php endwhile; ?>
    </tbody>
</table>
