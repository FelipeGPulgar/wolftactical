// src/pages/ProductListPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
// import './ProductListPage.css'; // Asegúrate de que este archivo exista o elimina la importación

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Inicia como true
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');

  useEffect(() => {
    const fetchProducts = async () => {
      // 1. Inicia la carga y limpia errores/productos anteriores
      setIsLoading(true);
      setError(null);
      // setProducts([]); // Considera si realmente necesitas limpiar aquí o si prefieres mostrar los anteriores mientras carga

      let apiUrl = 'http://localhost/schizotactical/backend/get_products.php';
      const params = new URLSearchParams(); // Usar URLSearchParams para construir la query string

      if (subcategory) {
        params.append('subcategory', subcategory);
      } else if (category) {
        params.append('category', category);
      } else {
        // Si no hay categoría ni subcategoría, establece un error y no hagas fetch
        setError("Por favor, selecciona una categoría o subcategoría.");
        setIsLoading(false);
        setProducts([]); // Asegura que no haya productos
        return; // Salir de la función
      }

      apiUrl += `?${params.toString()}`; // Añade los parámetros a la URL

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          console.log("Datos recibidos, actualizando estado:", data.data); // Log justo antes de setProducts
          // 2. Actualiza el estado con los productos recibidos
          setProducts(data.data);
        } else {
          console.error('API no exitosa o formato incorrecto:', data.message || data);
          setError(data.message || 'No se pudieron cargar los productos.');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error en fetchProducts:', err);
        setError(err.message || 'Error al conectar con el servidor.');
        setProducts([]);
      } finally {
        // 3. Termina la carga (SIEMPRE, incluso si hay error)
        setIsLoading(false);
        console.log("Carga finalizada."); // Log para ver cuándo termina isLoading
      }
    };

    // Llama a fetchProducts solo si hay categoría o subcategoría
    if (category || subcategory) {
      fetchProducts();
    } else {
      // Maneja el caso inicial o sin parámetros (ya cubierto en fetchProducts, pero podemos asegurar)
      setIsLoading(false);
      setError("Selecciona una categoría.");
      setProducts([]);
    }

  }, [category, subcategory]); // El efecto se re-ejecuta si cambian los parámetros

  const pageTitle = subcategory ? `Productos en ${subcategory}` : (category ? `Productos en ${category}` : 'Productos');

  // Log para depurar el estado en cada renderizado
  console.log("Renderizando - isLoading:", isLoading, "error:", error, "products.length:", products.length);

  return (
    <div className="product-list-page-container">
      <h2>{pageTitle}</h2>

      {/* 1. Muestra 'Cargando...' solo si isLoading es true */}
      {isLoading && <p>Cargando productos...</p>}

      {/* 2. Muestra error si existe y no está cargando */}
      {!isLoading && error && <p className="error-message">{error}</p>}

      {/* 3. Muestra productos o mensaje 'No encontrado' solo si NO está cargando Y NO hay error */}
      {!isLoading && !error && (
        <div className="product-list">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            // Este mensaje se muestra si !isLoading, !error, y products.length es 0
            <p>No se encontraron productos para "{subcategory || category}".</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductListPage;
