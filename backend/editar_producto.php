<?php
session_start();

// Verifica si el usuario está logueado como administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

include('conexion.php');  // Asegúrate de incluir el archivo de conexión

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id'];
    $nombre = $_POST['nombre'];
    $modelo = $_POST['modelo'];
    $categoria = $_POST['categoria'];
    $subcategoria = $_POST['subcategoria'];
    $stock_option = $_POST['stock_option'];
    $stock_quantity = $stock_option == 'instock' ? $_POST['stock_quantity'] : NULL;
    $precio = $_POST['precio'];
    
    // Verifica si se subió una nueva imagen
    if ($_FILES['imagen']['name']) {
        $imagen = $_FILES['imagen']['name'];
        move_uploaded_file($_FILES['imagen']['tmp_name'], 'imagenes/' . $imagen);
        $sql = "UPDATE products SET name='$nombre', model='$modelo', category='$categoria', subcategory='$subcategoria', 
                stock_option='$stock_option', stock_quantity='$stock_quantity', price='$precio', main_image='$imagen' WHERE id=$id";
    } else {
        // Si no se sube una nueva imagen, se conserva la imagen existente
        $sql = "UPDATE products SET name='$nombre', model='$modelo', category='$categoria', subcategory='$subcategoria', 
                stock_option='$stock_option', stock_quantity='$stock_quantity', price='$precio' WHERE id=$id";
    }

    if (mysqli_query($conn, $sql)) {
        echo "Producto actualizado con éxito.";
    } else {
        echo "Error: " . $sql . "<br>" . mysqli_error($conn);
    }
}

// Recuperar el producto a editar
$id = $_GET['id'];
$sql = "SELECT * FROM products WHERE id = $id";
$result = mysqli_query($conn, $sql);
$product = mysqli_fetch_assoc($result);
?>

<h1>Editar Producto</h1>
<form method="POST" enctype="multipart/form-data">
    <input type="hidden" name="id" value="<?php echo $product['id']; ?>">
    
    <label for="nombre">Nombre:</label>
    <input type="text" name="nombre" value="<?php echo $product['name']; ?>" required><br>

    <label for="modelo">Modelo:</label>
    <input type="text" name="modelo" value="<?php echo $product['model']; ?>" required><br>

    <label for="categoria">Categoría:</label>
    <input type="text" name="categoria" value="<?php echo $product['category']; ?>" required><br>

    <label for="subcategoria">Subcategoría:</label>
    <input type="text" name="subcategoria" value="<?php echo $product['subcategory']; ?>" required><br>

    <label for="stock_option">Stock:</label>
    <select name="stock_option" required>
        <option value="preorder" <?php echo $product['stock_option'] == 'preorder' ? 'selected' : ''; ?>>Por encargo</option>
        <option value="instock" <?php echo $product['stock_option'] == 'instock' ? 'selected' : ''; ?>>En stock</option>
    </select><br>

    <label for="stock_quantity">Cantidad en stock:</label>
    <input type="number" name="stock_quantity" value="<?php echo $product['stock_quantity']; ?>"><br>

    <label for="precio">Precio:</label>
    <input type="text" name="precio" value="<?php echo $product['price']; ?>" required><br>

    <label for="imagen">Imagen principal (dejar vacía para mantener la actual):</label>
    <input type="file" name="imagen" accept="image/*"><br>

    <input type="submit" value="Actualizar Producto">
</form>
