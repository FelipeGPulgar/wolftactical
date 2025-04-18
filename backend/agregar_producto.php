<?php
session_start();

// Verifica si el usuario está logueado como administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

include('conexion.php');  // Asegúrate de incluir el archivo de conexión

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Recibir los datos del formulario
    $nombre = $_POST['nombre'];
    $modelo = $_POST['modelo'];
    $categoria = $_POST['categoria'];
    $subcategoria = $_POST['subcategoria'];
    $stock_option = $_POST['stock_option'];
    $stock_quantity = $stock_option == 'instock' ? $_POST['stock_quantity'] : NULL;
    $precio = $_POST['precio'];
    $imagen = $_FILES['imagen']['name']; // Aquí se recibe la imagen principal

    // Subir la imagen
    move_uploaded_file($_FILES['imagen']['tmp_name'], 'imagenes/' . $imagen);

    // Insertar en la base de datos
    $sql = "INSERT INTO products (name, model, category, subcategory, stock_option, stock_quantity, price, main_image) 
            VALUES ('$nombre', '$modelo', '$categoria', '$subcategoria', '$stock_option', '$stock_quantity', '$precio', '$imagen')";
    if (mysqli_query($conn, $sql)) {
        echo "Producto agregado con éxito.";
    } else {
        echo "Error: " . $sql . "<br>" . mysqli_error($conn);
    }
}
?>

<!-- Formulario para agregar productos -->
<form method="POST" enctype="multipart/form-data">
    <label for="nombre">Nombre:</label>
    <input type="text" name="nombre" required><br>

    <label for="modelo">Modelo:</label>
    <input type="text" name="modelo" required><br>

    <label for="categoria">Categoría:</label>
    <input type="text" name="categoria" required><br>

    <label for="subcategoria">Subcategoría:</label>
    <input type="text" name="subcategoria" required><br>

    <label for="stock_option">Stock:</label>
    <select name="stock_option" required>
        <option value="preorder">Por encargo</option>
        <option value="instock">En stock</option>
    </select><br>

    <label for="stock_quantity">Cantidad en stock:</label>
    <input type="number" name="stock_quantity"><br>

    <label for="precio">Precio:</label>
    <input type="text" name="precio" required><br>

    <label for="imagen">Imagen principal:</label>
    <input type="file" name="imagen" accept="image/*" required><br>

    <input type="submit" value="Agregar Producto">
</form>
