<?php
session_start();

// Verifica si el usuario está logueado como administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

include('conexion.php');  // Asegúrate de incluir el archivo de conexión

if (isset($_GET['id'])) {
    $id = $_GET['id'];
    
    // Eliminar producto
    $sql = "DELETE FROM products WHERE id = $id";
    if (mysqli_query($conn, $sql)) {
        echo "Producto eliminado con éxito.";
    } else {
        echo "Error al eliminar el producto: " . mysqli_error($conn);
    }
}
?>
