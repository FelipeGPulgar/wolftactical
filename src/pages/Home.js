// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import HeroSection from "../components/HeroSection";
import Brands from "../components/Brands";
import Subscribe from "../components/Subscribe";
import Carousel from "../components/Carousel";
import VideoSection from "../components/VideoSection"; // Importar el nuevo componente

function Home() {
  // Eliminado el uso de setProducts ya que no está definido
  // const [products, setProducts] = useState([]);

  useEffect(() => {
    // Llamada a la API para obtener los productos
    fetch('http://localhost/schizotactical/backend/get_products.php')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Productos obtenidos:', data.data);
        } else {
          console.error('Error en la respuesta de la API:', data);
        }
      })
      .catch(error => console.error('Error al obtener productos:', error));
  }, []);

  return (
    <div>
      <Carousel />
      <Subscribe />
      <HeroSection />
      <VideoSection /> {/* Agregar el componente de video aquí */}
      
      {/* Eliminado Productos Destacados */}
      {/* <h2>Productos Destacados</h2>
      <div className="product-list">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p>No se encontraron productos.</p>
        )}
      </div> */}

      <Brands />
    </div>
  );
}

export default Home;
