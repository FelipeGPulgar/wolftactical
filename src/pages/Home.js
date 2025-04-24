// Importa useState junto con useEffect
import React, { useState, useEffect } from "react";
import HeroSection from "../components/HeroSection";
import Brands from "../components/Brands";
import Subscribe from "../components/Subscribe";
import Carousel from "../components/Carousel";
import VideoSection from "../components/VideoSection";
import ProductCard from "../components/ProductCard"; // <-- ¡Asegúrate de importar tu componente ProductCard!

function Home() {
  // Descomentado para usar el estado
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Llamada a la API para obtener los productos
    fetch('http://localhost/schizotactical/backend/get_products.php')
      .then(response => {
        // Añadir verificación de respuesta OK antes de parsear JSON
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.data)) { // Asegurarse que data.data es un array
          console.log('Productos obtenidos:', data.data);
          // Guardar los productos en el estado
          setProducts(data.data);
        } else {
          // Si data.success es false o data.data no es array, tratar como error o array vacío
          console.error('Error en la respuesta de la API o formato incorrecto:', data.message || data);
          setProducts([]); // Establecer como array vacío para evitar errores en .map
        }
      })
      .catch(error => {
          console.error('Error al obtener productos:', error);
          setProducts([]); // Establecer como array vacío en caso de error de fetch
      });
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente

  return (
    <div>
      <Carousel />
      <Subscribe />
      <HeroSection />
      <VideoSection /> {/* Agregar el componente de video aquí */}

      {/* Descomentado Productos Destacados */}
      <h2>Productos Destacados</h2>
      <div className="product-list"> {/* Asegúrate de tener estilos para .product-list */}
        {products.length > 0 ? (
          products.map((product) => (
            // Renderiza un ProductCard por cada producto en el estado
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          // Mensaje si no hay productos o mientras cargan
          <p>Cargando productos o no se encontraron productos.</p>
        )}
      </div>

      <Brands />
    </div>
  );
}

export default Home;
